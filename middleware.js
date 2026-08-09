import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  if (path.startsWith("/admin")) {
    if (!request.cookies.get("miamgo_admin")?.value) return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.next();
  }
  const requiredRole = path.startsWith("/espace-resto") ? "restaurant_owner" : path.startsWith("/espace-livreur") ? "driver" : null;
  if (!requiredRole) return NextResponse.next();
  const session = request.cookies.get("miamgo_session")?.value;
  if (!session || !process.env.MIAMGO_SESSION_SECRET) return NextResponse.redirect(new URL(`/connexion?returnTo=${encodeURIComponent(path)}`, request.url));
  let role;
  try { const verified = await jwtVerify(session, new TextEncoder().encode(process.env.MIAMGO_SESSION_SECRET)); role = verified.payload.role; } catch { return NextResponse.redirect(new URL(`/connexion?returnTo=${encodeURIComponent(path)}`, request.url)); }
  if (role !== requiredRole) return NextResponse.redirect(new URL(role === "restaurant_owner" ? "/espace-resto" : role === "driver" ? "/espace-livreur" : "/accueil", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/espace-resto/:path*", "/espace-livreur/:path*"] };
