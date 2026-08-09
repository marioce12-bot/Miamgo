import { NextResponse } from "next/server";
import { splitOrderAmount } from "../../../../lib/orderFees";
import { getAdminDb } from "../../../../lib/firebaseAdmin";

export async function POST(request) {
  const secret = process.env.FEDAPAY_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "FEDAPAY_SECRET_KEY est absente." }, { status: 500 });
  const input = await request.json();
  if (!input.orderId) return NextResponse.json({ error: "orderId est obligatoire." }, { status: 400 });
  const orderRef = getAdminDb().collection("orders").doc(String(input.orderId));
  const existing = await orderRef.get();
  if (!existing.exists) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  if (existing.data().paymentStatus === "paid") return NextResponse.json({ error: "Cette commande est déjà payée." }, { status: 409 });
  if (existing.data().paymentTransactionId) return NextResponse.json({ error: "Un paiement est déjà en cours pour cette commande.", transactionId: existing.data().paymentTransactionId }, { status: 409 });
  const breakdown = splitOrderAmount({ foodSubtotal: Number(input.foodSubtotal), deliveryFee: Number(input.deliveryFee || 0), courierShare: Number(input.courierShare || 0) });
  if (!Number.isFinite(breakdown.foodSubtotal) || breakdown.foodSubtotal <= 0) return NextResponse.json({ error: "Montant de plats invalide." }, { status: 400 });
  const baseUrl = process.env.FEDAPAY_ENVIRONMENT === "sandbox" ? "https://sandbox-api.fedapay.com/v1" : "https://api.fedapay.com/v1";
  const response = await fetch(`${baseUrl}/transactions`, { method: "POST", headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" }, body: JSON.stringify({ description: `Commande Miamgo ${input.orderId}`, amount: breakdown.total, currency: { iso: "XOF" }, callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin}/api/fedapay/webhook`, custom_metadata: { orderId: input.orderId, breakdown } }) });
  const payload = await response.json();
  if (!response.ok) return NextResponse.json({ error: payload?.message || "FedaPay a refusé la transaction." }, { status: 502 });
  const transactionId = payload.id || payload.data?.id;
  await orderRef.set({ paymentStatus: "pending", paymentTransactionId: String(transactionId), financials: breakdown, updatedAt: new Date() }, { merge: true });
  return NextResponse.json({ transaction: payload, breakdown });
}
