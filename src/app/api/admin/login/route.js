import { NextResponse } from "next/server";
import { createAdminSession, setAdminCookie } from "../../../../lib/adminAuth";

export async function POST(request) {
  const { password } = await request.json();
  const expectedPassword = String(process.env.MIAMGO_ADMIN_PASSWORD || "").trim();
  if (!expectedPassword) return NextResponse.json({ error: "Le code administrateur n’est pas configuré sur l’environnement Production." }, { status: 500 });
  if (String(password || "").trim() !== expectedPassword) return NextResponse.json({ error: "Mot de passe administrateur incorrect." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  setAdminCookie(response, createAdminSession());
  return response;
}
