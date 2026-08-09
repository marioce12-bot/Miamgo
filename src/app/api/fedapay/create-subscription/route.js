import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "../../../../lib/firebaseAdmin";

const prices = { Basique: 2500, Pro: 5000, "Premium IA": 12000 };
export const runtime = "nodejs";

export async function POST(request) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  const decoded = await getAdminAuth().verifyIdToken(authorization.slice(7));
  const { restaurantId, plan } = await request.json();
  if (!prices[plan]) return NextResponse.json({ error: "Plan invalide." }, { status: 400 });
  const db = getAdminDb(); const restaurantRef = db.collection("restaurants").doc(String(restaurantId)); const restaurant = await restaurantRef.get();
  if (!restaurant.exists || restaurant.data().ownerId !== decoded.uid) return NextResponse.json({ error: "Restaurant non autorisé." }, { status: 403 });
  if (restaurant.data().subscriptionStatus === "active" && restaurant.data().plan === plan && restaurant.data().subscriptionExpiresAt?.toDate?.() > new Date()) return NextResponse.json({ error: "Cet abonnement est déjà actif." }, { status: 409 });
   const secret = process.env.FEDAPAY_SECRET_KEY;
   if (!secret) return NextResponse.json({ error: "La clé secrète FedaPay n’est pas configurée sur le serveur." }, { status: 500 });
   const baseUrl = process.env.FEDAPAY_ENVIRONMENT === "sandbox" ? "https://sandbox-api.fedapay.com/v1" : "https://api.fedapay.com/v1";
   const transactionAmount = prices[plan];
   const transactionPayload = { description: `Abonnement Miamgo ${plan}`, amount: transactionAmount, currency: { iso: "XOF" }, customer: { email: decoded.email || undefined }, callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin}/api/fedapay/webhook`, custom_metadata: { type: "subscription", restaurantId: String(restaurantId), ownerId: decoded.uid, plan, amount: transactionAmount } };
   let response;
   try {
     response = await fetch(`${baseUrl}/transactions`, { method: "POST", headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(transactionPayload) });
   } catch (error) {
     return NextResponse.json({ error: "FedaPay est momentanément inaccessible.", details: error.message }, { status: 502 });
   }
   const rawPayload = await response.text();
   let payload; try { payload = rawPayload ? JSON.parse(rawPayload) : {}; } catch { payload = { raw: rawPayload.slice(0, 500) }; }
   if (!response.ok) {
     const errors = payload?.errors || payload?.data?.errors || payload?.data || payload?.raw || null;
     console.error("FedaPay subscription transaction rejected", { status: response.status, plan, amount: transactionAmount, errors });
     return NextResponse.json({ error: payload?.message || payload?.error || `FedaPay a refusé l'abonnement (${response.status}).`, details: errors }, { status: 502 });
   }
   const transactionId = payload.id || payload.data?.id;
   if (!transactionId) return NextResponse.json({ error: "FedaPay n’a pas retourné d’identifiant de transaction.", details: payload }, { status: 502 });
   await restaurantRef.set({ plan, subscriptionStatus: "payment_pending", subscriptionTransactionId: String(transactionId), updatedAt: new Date() }, { merge: true });
  return NextResponse.json({ transaction: payload, amount: prices[plan] });
}
