import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "../../../../lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(request) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  try {
    const actor = await getAdminAuth().verifyIdToken(authorization.slice(7));
    const { orderId, action, driverId } = await request.json();
    const db = getAdminDb();
    const orderRef = db.collection("orders").doc(String(orderId));
    const snapshot = await orderRef.get();
    if (!snapshot.exists) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
    const order = snapshot.data();
    const restaurant = await db.collection("restaurants").doc(String(order.restaurantId)).get();
    if (!restaurant.exists || restaurant.data().ownerId !== actor.uid) return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
    if (action === "preparing") {
      await orderRef.update({ status: "preparing", deliveryStatus: "preparation", updatedAt: new Date() });
    } else if (action === "ready") {
      await orderRef.update({ status: "ready", deliveryStatus: order.deliveryMode === "pickup" ? "ready" : "en_attente_livraison", updatedAt: new Date() });
    } else if (action === "assign") {
      const offerExpired = order.driverOfferExpiresAt?.toDate?.() && order.driverOfferExpiresAt.toDate() < new Date();
      if (order.deliveryMode !== "delivery" || !["ready", "driver_requested"].includes(order.status) || (order.status === "driver_requested" && !offerExpired) || !driverId) return NextResponse.json({ error: "Cette commande ne peut pas être assignée." }, { status: 409 });
      await orderRef.update({ assignedDriverId: String(driverId), deliveryStatus: "proposee", status: "driver_requested", driverOfferExpiresAt: new Date(Date.now() + 5 * 60 * 1000), updatedAt: new Date() });
    } else return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error.message || "Action impossible." }, { status: 500 }); }
}
