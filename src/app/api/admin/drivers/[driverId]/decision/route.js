import { NextResponse } from "next/server";
import { getAdminDb } from "../../../../../../lib/firebaseAdmin";
import { requireAdmin, suspendFirebaseUser } from "../../../../../../lib/adminAuth";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  try { requireAdmin(request); } catch { return NextResponse.json({ error: "Non autorisé." }, { status: 401 }); }
  const { decision, reason = "" } = await request.json();
  if (!["approve", "reject"].includes(decision)) return NextResponse.json({ error: "Décision invalide." }, { status: 400 });
  const approved = decision === "approve";
  await getAdminDb().collection("driverApplications").doc(params.driverId).set({ verificationStatus: approved ? "approved" : "rejected", status: approved ? "validated_unsubscribed" : "rejected", subscriptionStatus: approved ? "pending_payment" : "locked", rejectionReason: approved ? null : reason || "Dossier rejeté par l’administration.", reviewedAt: new Date() }, { merge: true });
  await getAdminDb().collection("users").doc(params.driverId).set({ verificationStatus: approved ? "approved" : "rejected", subscriptionStatus: approved ? "pending_payment" : "locked", availabilityStatus: "unavailable", rejectionReason: approved ? null : reason || "Dossier rejeté par l’administration.", updatedAt: new Date() }, { merge: true });
  await getAdminDb().collection("driverDirectory").doc(params.driverId).set({ verificationStatus: approved ? "approved" : "rejected", subscriptionStatus: approved ? "pending_payment" : "locked", availabilityStatus: "unavailable", updatedAt: new Date() }, { merge: true });
  await suspendFirebaseUser(params.driverId, !approved, reason);
  return NextResponse.json({ ok: true });
}
