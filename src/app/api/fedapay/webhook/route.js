import crypto from "node:crypto";
import { NextResponse } from "next/server";

export async function POST(request) {
  const rawBody = await request.text();
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET;
  const signature = request.headers.get("x-fedapay-signature");
  if (secret && signature) {
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    if (signature !== expected) return NextResponse.json({ error: "Signature invalide." }, { status: 401 });
  }
  const event = JSON.parse(rawBody);
  console.info("FedaPay event", event?.name || event?.event || "unknown");
  return NextResponse.json({ received: true });
}
