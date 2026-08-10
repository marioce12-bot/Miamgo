import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "../../../../lib/firebaseAdmin";
import { extractFedaPayTransactionId } from "../../../../lib/fedapay";

const DRIVER_PLAN = "Livreur Miamgo";
const DRIVER_PRICE = 3000;
export const runtime = "nodejs";

export async function POST(request) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  try {
    const decoded = await getAdminAuth().verifyIdToken(authorization.slice(7));
    const db = getAdminDb();
    const userRef = db.collection("users").doc(decoded.uid);
    const profile = await userRef.get();
    if (!profile.exists || profile.data().role !== "driver") return NextResponse.json({ error: "Cet abonnement est réservé aux livreurs." }, { status: 403 });
    if (profile.data().verificationStatus !== "approved") return NextResponse.json({ error: "Votre compte doit être validé par l’administration avant le paiement." }, { status: 403 });
    if (profile.data().subscriptionStatus === "active" && profile.data().subscriptionExpiresAt?.toDate?.() > new Date()) return NextResponse.json({ error: "Votre abonnement livreur est déjà actif." }, { status: 409 });
    const baseUrl = process.env.FEDAPAY_ENVIRONMENT === "sandbox" ? "https://sandbox-api.fedapay.com/v1" : "https://api.fedapay.com/v1";
    const response = await fetch(`${baseUrl}/transactions`, { method: "POST", headers: { Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ description: `Abonnement ${DRIVER_PLAN}`, amount: DRIVER_PRICE, currency: { iso: "XOF" }, custom_metadata: { type: "driver_subscription", driverId: decoded.uid, plan: DRIVER_PLAN, amount: DRIVER_PRICE } }) });
    const payload = await response.json();
    if (!response.ok) return NextResponse.json({ error: payload?.message || "FedaPay a refusé l’abonnement livreur." }, { status: 502 });
    const transactionId = String(extractFedaPayTransactionId(payload) || "");
    if (!transactionId) return NextResponse.json({ error: "Transaction FedaPay sans identifiant.", details: payload }, { status: 502 });
    await userRef.set({ subscriptionStatus: "payment_pending", subscriptionTransactionId: transactionId, subscriptionPlan: DRIVER_PLAN, subscriptionAmount: DRIVER_PRICE, updatedAt: new Date() }, { merge: true });
    return NextResponse.json({ transaction: payload, amount: DRIVER_PRICE, plan: DRIVER_PLAN });
  } catch (error) { return NextResponse.json({ error: error.message || "Impossible de créer l’abonnement livreur." }, { status: 500 }); }
}
