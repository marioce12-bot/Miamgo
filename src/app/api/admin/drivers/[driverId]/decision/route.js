import { NextResponse } from "next/server";
import { getAdminDb } from "../../../../../../lib/firebaseAdmin";
import { requireAdmin, suspendFirebaseUser } from "../../../../../../lib/adminAuth";
export const runtime = "nodejs";
export async function POST(request, { params }) {
  try {
    requireAdmin(request);
    const { driverId } = await params;
    if (!driverId) return NextResponse.json({ error: "Identifiant livreur manquant." }, { status: 400 });
    const { decision, reason = "" } = await request.json();
    if (!["approve", "reject"].includes(decision)) return NextResponse.json({ error: "Décision invalide." }, { status: 400 });
    const approved = decision === "approve"; const db = getAdminDb();
    const values = { verificationStatus: approved ? "approved" : "rejected", status: approved ? "validated_unsubscribed" : "rejected", subscriptionStatus: approved ? "pending_payment" : "locked", rejectionReason: approved ? null : reason || "Dossier rejeté par l’administration.", reviewedAt: new Date() };
    await Promise.all([db.collection("driverApplications").doc(driverId).set(values, { merge: true }), db.collection("users").doc(driverId).set({ ...values, availabilityStatus: "unavailable", updatedAt: new Date() }, { merge: true }), db.collection("driverDirectory").doc(driverId).set({ verificationStatus: values.verificationStatus, subscriptionStatus: values.subscriptionStatus, availabilityStatus: "unavailable", updatedAt: new Date() }, { merge: true })]);
    await suspendFirebaseUser(driverId, !approved, reason);
    return NextResponse.json({ ok: true, decision });
  } catch (error) { console.error("Admin driver decision failed", error); return NextResponse.json({ error: error.message || "Impossible de traiter la décision livreur." }, { status: 500 }); }
}