import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "../../../../lib/firebaseAdmin";

export async function GET(request) {
  if (request.cookies.get("miamgo_admin")?.value !== "authenticated") return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  try {
    const db = getAdminDb();
    const auth = getAdminAuth();
    const [users, restaurants, orders, drivers] = await Promise.all([
      auth.listUsers(1000),
      db.collection("restaurants").get(),
      db.collection("orders").get(),
      db.collection("driverApplications").get(),
    ]);
    const profiles = await Promise.all(users.users.slice(0, 100).map(async (user) => {
      const profile = await db.collection("users").doc(user.uid).get();
      return { uid: user.uid, email: user.email || "", disabled: user.disabled, createdAt: user.metadata.creationTime, ...(profile.exists ? profile.data() : {}) };
    }));
    return NextResponse.json({ counts: { users: users.users.length, restaurants: restaurants.size, orders: orders.size, drivers: drivers.size, suspended: users.users.filter((user) => user.disabled).length }, users: profiles, restaurants: restaurants.docs.slice(0, 100).map((item) => ({ id: item.id, ...item.data() })), drivers: drivers.docs.slice(0, 100).map((item) => ({ id: item.id, ...item.data() })) });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Firebase Admin non configuré." }, { status: 500 });
  }
}
