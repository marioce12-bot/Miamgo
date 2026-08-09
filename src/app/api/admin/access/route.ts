import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

const cookieName = "miamgo_admin_access";

function createToken(secret: string) {
  const payload = `${Date.now() + 1000 * 60 * 60 * 12}`;
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export async function POST(request: Request) {
  const adminCode = process.env.ADMIN_ACCESS_CODE;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  const { code } = await request.json() as { code?: string };
  if (!adminCode || !sessionSecret || !code) return NextResponse.json({ error: "Configuration manquante" }, { status: 503 });
  const expected = Buffer.from(adminCode);
  const provided = Buffer.from(code);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, createToken(sessionSecret), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 12, path: "/admin" });
  return response;
}
