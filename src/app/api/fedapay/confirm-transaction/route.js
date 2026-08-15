import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "../../../../lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(request) {
  const secret = process.env.FEDAPAY_SECRET_KEY;
  const authorization = request.headers.get("authorization") || "";
  if (!secret || !authorization.startsWith("Bearer ")) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  let actor;
  try { actor = await getAdminAuth().verifyIdToken(authorization.slice(7)); } catch { return NextResponse.json({ error: "Session invalide." }, { status: 401 }); }
  const { orderId, transactionId } = await request.json();
  if (!orderId || !transactionId) return NextResponse.json({ error: "Commande et transaction obligatoires." }, { status: 400 });
  const orderRef = getAdminDb().collection("orders").doc(String(orderId));
  const orderSnapshot = await orderRef.get();
  if (!orderSnapshot.exists || orderSnapshot.data().customerId !== actor.uid) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  const isSandbox = process.env.FEDAPAY_ENVIRONMENT === "sandbox" || /sandbox|test/i.test(secret);
  const baseUrl = isSandbox ? "https://sandbox-api.fedapay.com/v1" : "https://api.fedapay.com/v1";
  const response = await fetch(`${baseUrl}/transactions/${encodeURIComponent(transactionId)}`, { headers: { Authorization: `Bearer ${secret}`, Accept: "application/json" } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return NextResponse.json({ error: payload?.message || "Impossible de vérifier la transaction." }, { status: 502 });
  const transaction = payload?.v1?.transaction || payload?.transaction || payload?.data || payload;
  const status = String(transaction?.status || "").toLowerCase();
  if (["approved", "transferred", "paid"].includes(status)) {
    await orderRef.set({ paymentStatus: "paid", status: "paid", paymentTransactionId: String(transactionId), lastPaymentEvent: "client.confirmed", updatedAt: new Date() }, { merge: true });
    return NextResponse.json({ confirmed: true });
  }
  return NextResponse.json({ confirmed: false, status });
}
