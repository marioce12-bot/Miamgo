import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "../../../../lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  if (request.cookies.get("miamgo_admin")?.value !== "authenticated") return NextResponse.json({ error: "Non autorisé." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const db = getAdminDb();
    const auth = getAdminAuth();
    const [users, restaurants, orders, drivers, subscriptions] = await Promise.all([
      auth.listUsers(1000),
      db.collection("restaurants").get(),
      db.collection("orders").get(),
      db.collection("driverApplications").get(),
      db.collection("subscriptions").get(),
    ]);
    const paidOrders = orders.docs.filter((item) => ["paid", "completed", "delivered"].includes(item.data().paymentStatus || item.data().status));
    const orderFees = paidOrders.reduce((total, item) => total + Number(item.data().platformFee || item.data().financials?.platformFee || 0), 0);
    const subscriptionRevenue = subscriptions.docs.filter((item) => ["paid", "active", "completed"].includes(item.data().status || item.data().paymentStatus)).reduce((total, item) => total + Number(item.data().amount || item.data().price || 0), 0);
    const profiles = await Promise.all(users.users.slice(0, 100).map(async (user) => {
      const profile = await db.collection("users").doc(user.uid).get();
      return { uid: user.uid, email: user.email || "", disabled: user.disabled, createdAt: user.metadata.creationTime, ...(profile.exists ? profile.data() : {}) };
    }));
    return NextResponse.json({ counts: { users: users.users.length, restaurants: restaurants.size, orders: orders.size, drivers: drivers.size, suspended: users.users.filter((user) => user.disabled).length }, finance: { subscriptionRevenue, orderFees, totalRevenue: subscriptionRevenue + orderFees, paidOrders: paidOrders.length, paidSubscriptions: subscriptions.docs.filter((item) => ["paid", "active", "completed"].includes(item.data().status || item.data().paymentStatus)).length }, users: profiles, restaurants: restaurants.docs.slice(0, 100).map((item) => ({ id: item.id, ...item.data() })), drivers: drivers.docs.slice(0, 100).map((item) => ({ id: item.id, ...item.data() })) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Firebase Admin non configuré.", code: "ADMIN_FIREBASE_ERROR" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
