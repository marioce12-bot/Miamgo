import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "../../../../lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(request) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  try {
    const actor = await getAdminAuth().verifyIdToken(authorization.slice(7)); const { orderId } = await request.json(); const ref = getAdminDb().collection("orders").doc(String(orderId)); const snapshot = await ref.get();
    if (!snapshot.exists || snapshot.data().assignedDriverId !== actor.uid) return NextResponse.json({ error: "Cette course ne vous est pas assignée." }, { status: 403 });
    if (!["assignee", "en_cours_livraison"].includes(snapshot.data().deliveryStatus)) return NextResponse.json({ error: "Cette course ne peut pas démarrer." }, { status: 409 });
    await ref.update({ deliveryStatus: "en_cours_livraison", status: "out_for_delivery", trackingActive: true, startedAt: new Date(), updatedAt: new Date() });
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error.message || "Impossible de démarrer la course." }, { status: 500 }); }
}
