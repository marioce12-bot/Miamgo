import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "../../../../lib/firebaseAdmin";
import { requireAdmin } from "../../../../lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try { requireAdmin(request); } catch { return NextResponse.json({ error: "Non autorisé." }, { status: 401, headers: { "Cache-Control": "no-store" } }); }
  try {
    const period = request.nextUrl.searchParams.get("period") || "all";
    const selectedYear = Number(request.nextUrl.searchParams.get("year")) || new Date().getFullYear();
    const selectedDay = request.nextUrl.searchParams.get("day") || "";
    const periodStart = new Date();
    if (period === "day") periodStart.setHours(0, 0, 0, 0);
    if (period === "month") { periodStart.setDate(1); periodStart.setHours(0, 0, 0, 0); }
    if (period === "year") { periodStart.setMonth(0, 1); periodStart.setHours(0, 0, 0, 0); }
    const inPeriod = (item) => {
      if (period === "all") return true;
      const value = item.data().paidAt || item.data().createdAt || item.data().updatedAt;
      const timestamp = value?.toDate?.() || (value ? new Date(value) : null);
      return timestamp instanceof Date && !Number.isNaN(timestamp.valueOf()) && timestamp >= periodStart;
    };
    const itemDate = (item) => {
      const value = item.data().paidAt || item.data().createdAt || item.data().updatedAt;
      return value?.toDate?.() || (value ? new Date(value) : null);
    };
    const db = getAdminDb();
    const auth = getAdminAuth();
    const [users, restaurants, orders, drivers, subscriptions, posts, payments] = await Promise.all([
      auth.listUsers(1000),
      db.collection("restaurants").get(),
      db.collection("orders").get(),
      db.collection("driverApplications").get(),
      db.collection("subscriptions").get(),
      db.collection("posts").get(),
      Promise.all([db.collection("paymentEvents").get(), db.collection("fedapayEvents").get()]),
    ]);
    const paymentDocs = [...payments[0].docs, ...payments[1].docs];
    const paidOrders = orders.docs.filter((item) => inPeriod(item) && ["paid", "completed", "delivered"].includes(item.data().paymentStatus || item.data().status));
    const orderFees = paidOrders.reduce((total, item) => total + Number(item.data().platformFee || item.data().financials?.platformFee || 0), 0);
    const paidSubscriptions = subscriptions.docs.filter((item) => inPeriod(item) && ["paid", "active", "completed"].includes(item.data().status || item.data().paymentStatus));
    const subscriptionRevenue = paidSubscriptions.reduce((total, item) => total + Number(item.data().amount || item.data().price || 0), 0);
    const monthlyRevenue = Array.from({ length: 12 }, (_, month) => ({ month: month + 1, revenue: 0, orders: 0, subscriptions: 0 }));
    const hourlyRevenue = Array.from({ length: 24 }, (_, hour) => ({ hour, revenue: 0 }));
    const addSeriesValue = (item, amount, type) => {
      const timestamp = itemDate(item);
      if (!timestamp || timestamp.getFullYear() !== selectedYear) return;
      monthlyRevenue[timestamp.getMonth()].revenue += amount;
      monthlyRevenue[timestamp.getMonth()][type] += 1;
      if (selectedDay && timestamp.toISOString().slice(0, 10) === selectedDay) hourlyRevenue[timestamp.getHours()].revenue += amount;
    };
    orders.docs.filter((item) => ["paid", "completed", "delivered"].includes(item.data().paymentStatus || item.data().status)).forEach((item) => addSeriesValue(item, Number(item.data().platformFee || item.data().financials?.platformFee || 0), "orders"));
    subscriptions.docs.filter((item) => ["paid", "active", "completed"].includes(item.data().status || item.data().paymentStatus)).forEach((item) => addSeriesValue(item, Number(item.data().amount || item.data().price || 0), "subscriptions"));
    const dayRevenue = selectedDay ? hourlyRevenue.reduce((total, item) => total + item.revenue, 0) : 0;
    const profiles = await Promise.all(users.users.slice(0, 100).map(async (user) => {
      const profile = await db.collection("users").doc(user.uid).get();
      return { uid: user.uid, email: user.email || "", disabled: user.disabled, createdAt: user.metadata.creationTime, ...(profile.exists ? profile.data() : {}) };
    }));
    const driverApplications = await Promise.all(drivers.docs.map(async (item) => ({ id: item.id, ...item.data(), user: profiles.find((profile) => profile.uid === item.id) || null })));
    const restaurantRows = restaurants.docs.slice(0, 100).map((item) => ({ id: item.id, ...item.data(), subscriptionExpired: item.data().subscriptionExpiresAt?.toDate?.() ? item.data().subscriptionExpiresAt.toDate() <= new Date() : item.data().subscriptionStatus === "expired" }));
    const orderRows = orders.docs.slice(0, 200).map((item) => ({ id: item.id, ...item.data() }));
    const subscriptionRows = subscriptions.docs.slice(0, 200).map((item) => ({ id: item.id, ...item.data() }));
    return NextResponse.json({ period, counts: { users: users.users.length, restaurants: restaurants.size, orders: orders.size, drivers: drivers.size, suspended: users.users.filter((user) => user.disabled).length, posts: posts.size }, finance: { subscriptionRevenue, orderFees, totalRevenue: subscriptionRevenue + orderFees, paidOrders: paidOrders.length, paidSubscriptions: paidSubscriptions.length, paymentEvents: paymentDocs.length, selectedYear, selectedDay, monthlyRevenue, hourlyRevenue, dayRevenue }, users: profiles, restaurants: restaurantRows, drivers: driverApplications, orders: orderRows, subscriptions: subscriptionRows, payments: paymentDocs.slice(0, 200).map((item) => ({ id: item.id, ...item.data() })), posts: posts.docs.slice(0, 200).map((item) => ({ id: item.id, ...item.data() })) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Firebase Admin non configuré.", code: "ADMIN_FIREBASE_ERROR" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
