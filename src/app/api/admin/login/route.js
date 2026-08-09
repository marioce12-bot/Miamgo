import { NextResponse } from "next/server";
import { createAdminSession, setAdminCookie } from "../../../../lib/adminAuth";

export async function POST(request) {
  const { password } = await request.json();
  if (!process.env.MIAMGO_ADMIN_PASSWORD || password !== process.env.MIAMGO_ADMIN_PASSWORD) return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  setAdminCookie(response, createAdminSession());
  return response;
}
