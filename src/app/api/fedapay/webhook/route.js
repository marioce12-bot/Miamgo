import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminDb } from "../../../../lib/firebaseAdmin";

export async function POST(request) {
  const rawBody = await request.text();
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET;
  const signature = request.headers.get("x-fedapay-signature");
  if (secret && signature) {
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    if (signature !== expected) return NextResponse.json({ error: "Signature invalide." }, { status: 401 });
  }
  const event = JSON.parse(rawBody);
  const name = event?.name || event?.event || event?.type || "unknown";
  const data = event?.data || event?.object || event?.transaction || event?.payout || {};
  const orderId = data?.metadata?.orderId || data?.custom_metadata?.orderId || data?.metadata?.order_id;
  if (orderId) {
    const status = name.includes("approved") || name.includes("transferred") ? "paid" : name.includes("declined") || name.includes("canceled") || name.includes("failed") ? "payment_failed" : null;
    if (status) await getAdminDb().collection("orders").doc(String(orderId)).set({ paymentStatus: status, lastPaymentEvent: name, updatedAt: new Date() }, { merge: true });
  }
  if (name.startsWith("payout.")) await getAdminDb().collection("paymentEvents").add({ type: name, payload: data, receivedAt: new Date() });
  return NextResponse.json({ received: true });
}
