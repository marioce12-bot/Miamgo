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
  const baseUrl = process.env.FEDAPAY_ENVIRONMENT === "sandbox" ? "https://sandbox-api.fedapay.com/v1" : "https://api.fedapay.com/v1";
  const response = await fetch(`${baseUrl}/transactions`, { method: "POST", headers: { Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ description: `Abonnement Miamgo ${plan}`, amount: prices[plan], currency: { iso: "XOF" }, custom_metadata: { type: "subscription", restaurantId, ownerId: decoded.uid, plan } }) });
  const payload = await response.json(); if (!response.ok) return NextResponse.json({ error: payload?.message || "FedaPay a refusé l'abonnement." }, { status: 502 });
  await restaurantRef.set({ plan, subscriptionStatus: "payment_pending", subscriptionTransactionId: String(payload.id || payload.data?.id), updatedAt: new Date() }, { merge: true });
  return NextResponse.json({ transaction: payload, amount: prices[plan] });
}
