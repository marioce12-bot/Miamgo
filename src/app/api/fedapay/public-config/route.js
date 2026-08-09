import { NextResponse } from "next/server";
export function GET() { const publicKey = process.env.FEDAPAY_PUBLIC_KEY || process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY; if (!publicKey) return NextResponse.json({ error: "FEDAPAY_PUBLIC_KEY est absente." }, { status: 500 }); return NextResponse.json({ publicKey }); }
