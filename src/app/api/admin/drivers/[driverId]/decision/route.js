import { NextResponse } from "next/server";
import { getAdminDb } from "../../../../../../lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  if (request.cookies.get("miamgo_admin")?.value !== "authenticated") return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const { decision } = await request.json();
  if (!["approve", "reject"].includes(decision)) return NextResponse.json({ error: "Décision invalide." }, { status: 400 });
  const approved = decision === "approve";
  await getAdminDb().collection("driverApplications").doc(params.driverId).set({ verificationStatus: approved ? "approved" : "rejected", status: approved ? "validated_unsubscribed" : "rejected", subscriptionStatus: approved ? "pending_payment" : "locked", reviewedAt: new Date() }, { merge: true });
  await getAdminDb().collection("users").doc(params.driverId).set({ verificationStatus: approved ? "approved" : "rejected", subscriptionStatus: approved ? "pending_payment" : "locked", updatedAt: new Date() }, { merge: true });
  return NextResponse.json({ ok: true });
}
