import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const secret = process.env.FEDAPAY_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "FedaPay sera activé après configuration des secrets Vercel." }, { status: 503 });
  const body = await request.json() as { amount?: number; description?: string; customer?: { email?: string; phone_number?: { number: string; country: string } } };
  if (!body.amount || !body.customer?.email || !body.customer.phone_number) return NextResponse.json({ error: "Informations de paiement incomplètes." }, { status: 400 });
  const endpoint = process.env.FEDAPAY_ENVIRONMENT === "live" ? "https://api.fedapay.com/v1/transactions" : "https://sandbox-api.fedapay.com/v1/transactions";
  const response = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${secret}`, "content-type": "application/json" }, body: JSON.stringify({ description: body.description ?? "Commande MiamGo", amount: body.amount, currency: { iso: "XOF" }, customer: body.customer }) });
  const result = await response.json();
  if (!response.ok) return NextResponse.json({ error: result.message ?? "Transaction FedaPay impossible." }, { status: response.status });
  return NextResponse.json(result);
}
