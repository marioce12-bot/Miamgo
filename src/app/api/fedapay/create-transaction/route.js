import { NextResponse } from "next/server";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { getAdminAuth } from "../../../../lib/firebaseAdmin";
import { splitOrderAmount } from "../../../../lib/orderFees";
import { extractFedaPayTransactionId } from "../../../../lib/fedapay";

export async function POST(request) {
  const secret = process.env.FEDAPAY_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "FEDAPAY_SECRET_KEY est absente." }, { status: 500 });
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  let decoded;
  try { decoded = await getAdminAuth().verifyIdToken(authorization.slice(7)); } catch { return NextResponse.json({ error: "Session invalide." }, { status: 401 }); }
  const input = await request.json();
  if (!input.orderId) return NextResponse.json({ error: "orderId est obligatoire." }, { status: 400 });
  const orderRef = getAdminDb().collection("orders").doc(String(input.orderId));
  const existing = await orderRef.get();
  if (!existing.exists) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  if (existing.data().paymentStatus === "paid") return NextResponse.json({ error: "Cette commande est déjà payée." }, { status: 409 });
  if (existing.data().paymentTransactionId) return NextResponse.json({ error: "Un paiement est déjà en cours pour cette commande.", transactionId: existing.data().paymentTransactionId }, { status: 409 });
  const order = existing.data();
  if (order.customerId !== decoded.uid) return NextResponse.json({ error: "Cette commande ne vous appartient pas." }, { status: 403 });
  const items = Array.isArray(order.items) ? order.items : [];
  const foodSubtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  if (!Number.isFinite(foodSubtotal) || foodSubtotal <= 0) return NextResponse.json({ error: "Le panier de la commande est invalide." }, { status: 400 });
  const customerOrders = await getAdminDb().collection("orders").where("customerId", "==", decoded.uid).get();
  const paidOrders = customerOrders.docs.filter((doc) => doc.data().paymentStatus === "paid");
  const deliveryFee = order.deliveryMode === "pickup" ? 0 : Number(order.deliveryFee || 0);
  const courierShare = Math.max(0, Math.min(deliveryFee, Number(order.courierShare || 0)));
  const breakdown = splitOrderAmount({ foodSubtotal, deliveryFee, courierShare, paidOrderCount: paidOrders.length });
  const baseUrl = process.env.FEDAPAY_ENVIRONMENT === "sandbox" ? "https://sandbox-api.fedapay.com/v1" : "https://api.fedapay.com/v1";
  const response = await fetch(`${baseUrl}/transactions`, { method: "POST", headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ description: `Commande Miamgo ${input.orderId}`, amount: breakdown.total, currency: { iso: "XOF" }, customer: { email: decoded.email || undefined }, callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin}/api/fedapay/webhook`, custom_metadata: { orderId: input.orderId, breakdown } }) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return NextResponse.json({ error: payload?.message || payload?.error || "FedaPay a refusé la transaction.", details: payload?.errors || payload?.data || null }, { status: 502 });
  const transactionId = extractFedaPayTransactionId(payload);
  if (!transactionId) return NextResponse.json({ error: "FedaPay n’a pas retourné d’identifiant de transaction." }, { status: 502 });
  await orderRef.set({ paymentStatus: "pending", paymentTransactionId: String(transactionId), financials: breakdown, total: breakdown.total, updatedAt: new Date() }, { merge: true });
  return NextResponse.json({ transaction: payload, breakdown });
}
