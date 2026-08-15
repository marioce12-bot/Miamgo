import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "../../../../lib/firebaseAdmin";

export const runtime = "nodejs";

async function restaurantFor(request) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) throw new Error("Authentification requise.");
  const actor = await getAdminAuth().verifyIdToken(authorization.slice(7));
  const restaurants = await getAdminDb().collection("restaurants").where("ownerId", "==", actor.uid).limit(1).get();
  if (restaurants.empty) throw new Error("Restaurant introuvable.");
  return restaurants.docs[0];
}

export async function GET(request) {
  try {
    const restaurant = await restaurantFor(request); const db = getAdminDb(); const customerId = request.nextUrl.searchParams.get("customerId");
    const ordersSnapshot = await db.collection("orders").where("restaurantId", "==", restaurant.id).get();
    let orders = ordersSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => !customerId || item.customerId === customerId);
    if (customerId) { const menuSnapshot = await restaurant.ref.collection("menuItems").get(); const menu = new Map(menuSnapshot.docs.map((item) => [item.id, item.data()])); orders = orders.map((order) => ({ ...order, items: (order.items || []).map((item) => ({ ...item, imageUrl: item.imageUrl || menu.get(item.id)?.imageUrl || null })) })); }
    if (customerId) { const profile = await db.collection("users").doc(customerId).get(); return NextResponse.json({ orders, customer: { id: customerId, ...(profile.exists ? profile.data() : {}) } }); }
    const groups = new Map();
    for (const order of orders) { const id = order.customerId; if (!id) continue; const group = groups.get(id) || { id, ordersCount: 0, activeCount: 0, latestOrderAt: order.createdAt || null }; group.ordersCount += 1; if (order.status !== "completed") group.activeCount += 1; if ((order.createdAt?.toMillis?.() || 0) > (group.latestOrderAt?.toMillis?.() || 0)) group.latestOrderAt = order.createdAt; groups.set(id, group); }
    const clients = await Promise.all([...groups.values()].map(async (group) => { const profile = await db.collection("users").doc(group.id).get(); return { ...group, displayName: profile.data()?.displayName || "Client Miamgo", photoURL: profile.data()?.photoURL || null, city: profile.data()?.city || "" }; }));
    return NextResponse.json({ clients });
  } catch (error) { return NextResponse.json({ error: error.message || "Impossible de charger les clients." }, { status: 500 }); }
}
