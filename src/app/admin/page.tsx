import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { AdminCodeForm } from "@/components/admin-code-form";
import { DashboardShell } from "@/components/dashboard-shell";

function hasValidAccess(token: string | undefined) {
   const secret = process.env.ADMIN_SESSION_SECRET || process.env.MIAMGO_SESSION_SECRET || process.env.MIAMGO_ADMIN_PASSWORD;
  if (!token || !secret) return false;
  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature || Number(expiresAt) < Date.now()) return false;
  const expected = createHmac("sha256", secret).update(expiresAt).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function AdminPage() {
  const token = (await cookies()).get("miamgo_admin_access")?.value;
  if (!hasValidAccess(token)) return <AdminCodeForm />;
  return <DashboardShell role="admin" />;
}
