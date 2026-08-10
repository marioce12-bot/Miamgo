import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

const cookieName = "miamgo_admin_access";

function createToken(secret: string) {
  const payload = `${Date.now() + 1000 * 60 * 60 * 12}`;
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export async function POST(request: Request) {
   const adminCode = String(process.env.ADMIN_ACCESS_CODE || process.env.MIAMGO_ADMIN_PASSWORD || "").trim();
   const sessionSecret = String(process.env.ADMIN_SESSION_SECRET || process.env.MIAMGO_SESSION_SECRET || adminCode).trim();
  const { code } = await request.json() as { code?: string };
   if (!adminCode || !sessionSecret || !code) return NextResponse.json({ error: "Le code administrateur n’est pas configuré sur l’environnement Production." }, { status: 503 });
  const expected = Buffer.from(adminCode);
   const provided = Buffer.from(String(code).trim());
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, createToken(sessionSecret), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 12, path: "/admin" });
  return response;
}
