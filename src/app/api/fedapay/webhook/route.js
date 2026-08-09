import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminDb } from "../../../../lib/firebaseAdmin";

export const runtime = "nodejs";

async function sendPayout(recipient, amount, orderId, recipientType) {
  if (!recipient?.payoutDetails || !amount || amount <= 0) return { skipped: true, reason: "missing-beneficiary-or-amount" };
  const response = await fetch(`${process.env.FEDAPAY_ENVIRONMENT === "sandbox" ? "https://sandbox-api.fedapay.com/v1" : "https://api.fedapay.com/v1"}/payouts`, { method: "POST", headers: { Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ amount, currency: { iso: "XOF" }, mode: "mobile_money", customer: { firstname: recipient.payoutDetails.firstName, lastname: recipient.payoutDetails.lastName, phone_number: { number: recipient.payoutDetails.phone, country: (recipient.payoutDetails.country || "BJ").toLowerCase() } }, metadata: { orderId, recipientType } }) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.message || "Payout FedaPay refusé.");
  return payload;
}

export async function POST(request) {
  const rawBody = await request.text(); const secret = process.env.FEDAPAY_WEBHOOK_SECRET; const signature = request.headers.get("x-fedapay-signature");
  if (secret && signature && signature !== crypto.createHmac("sha256", secret).update(rawBody).digest("hex")) return NextResponse.json({ error: "Signature invalide." }, { status: 401 });
  let event; try { event = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Payload invalide." }, { status: 400 }); }
  const name = event?.name || event?.event || event?.type || "unknown"; const data = event?.data || event?.object || event?.transaction || event?.payout || {}; const eventId = String(event?.id || data?.id || crypto.createHash("sha256").update(rawBody).digest("hex")); const orderId = data?.custom_metadata?.orderId || data?.metadata?.orderId || data?.metadata?.order_id;
  const db = getAdminDb(); const eventRef = db.collection("fedapayEvents").doc(eventId); const already = await eventRef.get(); if (already.exists) return NextResponse.json({ received: true, duplicate: true }); await eventRef.set({ name, receivedAt: new Date() });
  if (!orderId || !["transaction.approved", "transaction.transferred", "transaction.declined", "transaction.canceled", "transaction.expired"].includes(name)) return NextResponse.json({ received: true });
  const orderRef = db.collection("orders").doc(String(orderId)); let order;
  await db.runTransaction(async (transaction) => { const snapshot = await transaction.get(orderRef); if (!snapshot.exists) throw new Error("ORDER_NOT_FOUND"); order = snapshot.data(); if (order.paymentStatus === "paid") return; const approved = name === "transaction.approved" || name === "transaction.transferred"; transaction.set(orderRef, { paymentStatus: approved ? "paid" : "payment_failed", status: approved ? "paid" : "payment_failed", lastPaymentEvent: name, updatedAt: new Date(), ...(approved ? { payoutStatus: "pending" } : {}) }, { merge: true }); });
  if (order?.paymentStatus === "paid") return NextResponse.json({ received: true, duplicate: true });
  if (name === "transaction.approved" || name === "transaction.transferred") {
    const restaurant = await db.collection("restaurants").doc(String(order.restaurantId)).get(); const driver = order.driverId ? await db.collection("users").doc(String(order.driverId)).get() : null; const financials = order.financials || data?.custom_metadata?.breakdown || {}; const payouts = [];
    try { if (restaurant.exists) payouts.push(await sendPayout(restaurant.data(), Number(financials.restaurantShare || financials.foodSubtotal || 0), orderId, "restaurant")); if (driver?.exists) payouts.push(await sendPayout(driver.data(), Number(financials.courierShare || 0), orderId, "driver")); await orderRef.set({ payoutStatus: "sent", payoutResults: payouts, updatedAt: new Date() }, { merge: true }); } catch (error) { await orderRef.set({ payoutStatus: "failed", payoutError: error.message, updatedAt: new Date() }, { merge: true }); }
  }
  return NextResponse.json({ received: true });
}
