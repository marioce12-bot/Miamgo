import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { getAdminAuth, getAdminDb } from "../../../../lib/firebaseAdmin";

export const runtime = "nodejs";
export async function POST(request) {
  const authorization = request.headers.get("authorization") || "";
  const missing = ["MIAMGO_SESSION_SECRET", "FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"].filter((key) => !process.env[key]);
  if (missing.length) return NextResponse.json({ error: `Configuration serveur incomplète: ${missing.join(", ")}.` }, { status: 500 });
  if (!authorization.startsWith("Bearer ")) return NextResponse.json({ error: "Token Firebase absent." }, { status: 401 });
  try {
    const decoded = await getAdminAuth().verifyIdToken(authorization.slice(7));
    const profile = await getAdminDb().collection("users").doc(decoded.uid).get();
    const role = profile.data()?.role || "client";
    const token = await new SignJWT({ uid: decoded.uid, role }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("8h").sign(new TextEncoder().encode(process.env.MIAMGO_SESSION_SECRET));
    const response = NextResponse.json({ ok: true, role });
    response.cookies.set("miamgo_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 8, path: "/" });
    return response;
  } catch (error) { return NextResponse.json({ error: error?.message || "Impossible de créer la session serveur." }, { status: 500 }); }
}
