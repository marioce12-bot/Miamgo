import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { getAdminAuth, getAdminDb } from "../../../../lib/firebaseAdmin";

export const runtime = "nodejs";
export async function POST(request) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ") || !process.env.MIAMGO_SESSION_SECRET) return NextResponse.json({ error: "Session server non configurée." }, { status: 500 });
  try {
    const decoded = await getAdminAuth().verifyIdToken(authorization.slice(7));
    const profile = await getAdminDb().collection("users").doc(decoded.uid).get();
    const role = profile.data()?.role || "client";
    const token = await new SignJWT({ uid: decoded.uid, role }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("8h").sign(new TextEncoder().encode(process.env.MIAMGO_SESSION_SECRET));
    const response = NextResponse.json({ ok: true, role });
    response.cookies.set("miamgo_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 8, path: "/" });
    return response;
  } catch { return NextResponse.json({ error: "Token Firebase invalide." }, { status: 401 }); }
}
