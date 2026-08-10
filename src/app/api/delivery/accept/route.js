import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, getAdminRealtimeDb } from "../../../../lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(request) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  try {
    const actor = await getAdminAuth().verifyIdToken(authorization.slice(7));
    const { orderId } = await request.json();
    const db = getAdminDb(); const orderRef = db.collection("orders").doc(String(orderId));
    const orderSnapshot = await orderRef.get();
    if (!orderSnapshot.exists) return NextResponse.json({ error: "Course introuvable." }, { status: 404 });
    const order = orderSnapshot.data();
    if (order.deliveryMode !== "delivery" || order.deliveryStatus !== "en_attente_livraison" || order.assignedDriverId) return NextResponse.json({ error: "Cette course n’est plus disponible." }, { status: 409 });
    const driver = await db.collection("users").doc(actor.uid).get();
    if (!driver.exists || driver.data().role !== "driver") return NextResponse.json({ error: "Seul un livreur peut accepter cette course." }, { status: 403 });
    const restaurant = await db.collection("restaurants").doc(String(order.restaurantId)).get();
    const ownerId = restaurant.data()?.ownerId;
    await orderRef.update({ assignedDriverId: actor.uid, deliveryStatus: "assignee", status: "assigned", trackingActive: false, updatedAt: new Date() });
    const access = getAdminRealtimeDb().ref(`deliveryAccess/${orderId}`);
    await Promise.all([access.child(actor.uid).set(true), access.child(String(order.customerId)).set(true), ownerId ? access.child(String(ownerId)).set(true) : Promise.resolve()]);
    return NextResponse.json({ ok: true, orderId: String(orderId), assignedDriverId: actor.uid });
  } catch (error) { return NextResponse.json({ error: error.message || "Impossible d’accepter la course." }, { status: 500 }); }
}
