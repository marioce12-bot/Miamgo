import { NextResponse } from "next/server";
import { splitOrderAmount } from "../../../../lib/orderFees";

export async function POST(request) {
  const secret = process.env.FEDAPAY_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "FEDAPAY_SECRET_KEY est absente." }, { status: 500 });
  const input = await request.json();
  const breakdown = splitOrderAmount({ foodSubtotal: Number(input.foodSubtotal), deliveryFee: Number(input.deliveryFee || 0), courierShare: Number(input.courierShare || 0) });
  if (!Number.isFinite(breakdown.foodSubtotal) || breakdown.foodSubtotal <= 0) return NextResponse.json({ error: "Montant de plats invalide." }, { status: 400 });
  const response = await fetch("https://api.fedapay.com/v1/transactions", { method: "POST", headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" }, body: JSON.stringify({ description: `Commande Miamgo ${input.orderId || ""}`, amount: breakdown.total, currency: { iso: "XOF" }, callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin}/api/fedapay/webhook`, customer: { email: input.customerEmail, phone_number: { number: input.customerPhone, country: input.customerCountry || "bj" } }, metadata: { orderId: input.orderId, breakdown } }) });
  const payload = await response.json();
  if (!response.ok) return NextResponse.json({ error: payload?.message || "FedaPay a refusé la transaction." }, { status: 502 });
  return NextResponse.json({ transaction: payload, breakdown });
}
