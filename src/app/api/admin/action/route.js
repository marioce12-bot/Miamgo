import { NextResponse } from "next/server";
import { requireAdmin, suspendFirebaseUser } from "../../../../lib/adminAuth";
import { getAdminDb } from "../../../../lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(request) {
  try { requireAdmin(request); } catch { return NextResponse.json({ error: "Non autorisé." }, { status: 401 }); }
  try {
    const { action, id, mode, reason = "" } = await request.json();
    const db = getAdminDb();
    if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });
    if (action === "restaurant-status") {
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
