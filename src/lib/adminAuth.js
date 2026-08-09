import crypto from "node:crypto";
import { getAdminAuth } from "./firebaseAdmin";

const cookieName = "miamgo_admin";

function secret() {
  return process.env.MIAMGO_SESSION_SECRET || process.env.MIAMGO_ADMIN_PASSWORD;
}

export function createAdminSession() {
  const value = `admin.${Date.now()}.${crypto.randomBytes(24).toString("hex")}`;
  const signature = crypto.createHmac("sha256", secret()).update(value).digest("hex");
  return `${value}.${signature}`;
}

export function isAdminSession(value) {
  if (!value || !secret()) return false;
  const [payload, signature] = [value.slice(0, value.lastIndexOf(".")), value.slice(value.lastIndexOf(".") + 1)];
  if (!payload || !signature) return false;
  if (!payload.startsWith("admin.")) return false;
  const expected = crypto.createHmac("sha256", secret()).update(payload).digest("hex");
  return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export function requireAdmin(request) {
  if (!isAdminSession(request.cookies.get(cookieName)?.value)) {
    throw new Error("ADMIN_UNAUTHORIZED");
  }
}

export function setAdminCookie(response, value) {
  response.cookies.set(cookieName, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
}

export function clearAdminCookie(response) {
  response.cookies.set(cookieName, "", { httpOnly: true, maxAge: 0, path: "/" });
}

export async function suspendFirebaseUser(uid, suspended, reason = "") {
  const auth = getAdminAuth();
  await auth.updateUser(uid, { disabled: suspended });
  await auth.setCustomUserClaims(uid, { suspended: Boolean(suspended) });
  return { suspended: Boolean(suspended), reason };
}
