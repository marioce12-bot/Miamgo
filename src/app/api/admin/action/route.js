import { NextResponse } from "next/server";
import { requireAdmin, suspendFirebaseUser } from "../../../../lib/adminAuth";
import { getAdminDb } from "../../../../lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(request) {
  try { requireAdmin(request); } catch { return NextResponse.json({ error: "Non autorisé." }, { status: 401 }); }
  try {
    const { action, id, mode, reason = "", accountType, plan = "Accès administrateur", durationDays } = await request.json();
    const db = getAdminDb();
    if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });
    if (action === "subscription") {
      const days = Number(durationDays);
      if (!Number.isInteger(days) || days < 1 || days > 3650) return NextResponse.json({ error: "La durée doit être comprise entre 1 et 3650 jours." }, { status: 400 });
      const active = mode === "activate";
      const status = active ? "active" : accountType === "driver" ? "locked" : "inactive";
      const expiry = active ? new Date(Date.now() + days * 86400000) : null;
      if (accountType === "restaurant") {
        await db.collection("restaurants").doc(String(id)).set({ plan: active ? plan : null, subscriptionPlan: active ? plan : null, subscriptionStatus: status, subscriptionExpiresAt: expiry, subscriptionSource: active ? "admin" : null, updatedAt: new Date() }, { merge: true });
      } else if (accountType === "driver") {
        const values = { subscriptionPlan: active ? plan : null, subscriptionStatus: status, subscriptionExpiresAt: expiry, subscriptionSource: active ? "admin" : null, updatedAt: new Date() };
        await Promise.all([db.collection("users").doc(String(id)).set(values, { merge: true }), db.collection("driverDirectory").doc(String(id)).set({ subscriptionStatus: status, updatedAt: new Date() }, { merge: true }), db.collection("driverApplications").doc(String(id)).set(values, { merge: true })]);
      } else return NextResponse.json({ error: "Type de compte invalide." }, { status: 400 });
      return NextResponse.json({ ok: true, status, expiresAt: expiry });
    }    if (action === "restaurant-status") {
      const ref = db.collection("restaurants").doc(String(id));
      const snapshot = await ref.get();
      if (!snapshot.exists) return NextResponse.json({ error: "Restaurant introuvable." }, { status: 404 });
      const suspended = mode === "suspend";
      await ref.set({ status: suspended ? "suspended" : snapshot.data().statusBeforeSuspension || "active", statusBeforeSuspension: suspended ? snapshot.data().status || "active" : null, suspensionReason: suspended ? reason || "Restaurant suspendu par l’administration." : null, updatedAt: new Date() }, { merge: true });
      return NextResponse.json({ ok: true, status: suspended ? "suspended" : "active" });
    }
    if (action === "user-suspension") {
      const suspended = mode === "suspend";
      await suspendFirebaseUser(String(id), suspended, reason);
      await db.collection("users").doc(String(id)).set({ suspended, suspensionReason: suspended ? reason || "Compte suspendu par l’administration." : null, updatedAt: new Date() }, { merge: true });
      return NextResponse.json({ ok: true, suspended });
    }
    if (action === "remove-post") {
      await db.collection("posts").doc(String(id)).set({ moderationStatus: "removed", removedReason: reason || "Contenu retiré par l’administration.", removedAt: new Date() }, { merge: true });
      return NextResponse.json({ ok: true, moderationStatus: "removed" });
    }
    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (error) { return NextResponse.json({ error: error.message || "Action impossible." }, { status: 500 }); }
}
