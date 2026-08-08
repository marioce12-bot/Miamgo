import { NextResponse } from "next/server";

export async function POST(request) {
  const secret = process.env.FEDAPAY_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "FEDAPAY_SECRET_KEY est absente." }, { status: 500 });
  const input = await request.json();
  if (!input.amount || !input.phone || !input.firstName || !input.lastName) return NextResponse.json({ error: "Bénéficiaire ou montant incomplet." }, { status: 400 });
  const response = await fetch("https://api.fedapay.com/v1/payouts", { method: "POST", headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" }, body: JSON.stringify({ amount: Number(input.amount), currency: { iso: "XOF" }, mode: "mobile_money", customer: { firstname: input.firstName, lastname: input.lastName, email: input.email, phone_number: { number: input.phone, country: input.country || "bj" } }, metadata: { orderId: input.orderId, recipientType: input.recipientType } }) });
  const payload = await response.json();
  if (!response.ok) return NextResponse.json({ error: payload?.message || "FedaPay a refusé le payout." }, { status: 502 });
  return NextResponse.json({ payout: payload });
}
