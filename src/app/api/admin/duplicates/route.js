import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/adminAuth";
import { getAdminAuth, getAdminDb } from "../../../../lib/firebaseAdmin";
import { normalizePhone } from "../../../../lib/phone";

export const runtime = "nodejs";

function valueDate(value) {
  return value?.toDate?.() || (value ? new Date(value) : null);
}

function completeness(data) {
  return Object.values(data || {}).filter((value) => value !== null && value !== undefined && value !== "").length;
}

function duplicateGroups(records, category) {
  const groups = new Map();
  records.forEach((record) => {
    const key = normalizePhone(record.phone);
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  });
  return [...groups.entries()].filter(([, items]) => items.length > 1).map(([phone, items]) => {
    const sorted = [...items].sort((a, b) => {
      const aDate = valueDate(a.updatedAt || a.createdAt)?.getTime?.() || 0;
      const bDate = valueDate(b.updatedAt || b.createdAt)?.getTime?.() || 0;
      return (completeness(b) * 1e13 + bDate) - (completeness(a) * 1e13 + aDate);
    });
    return { category, phone, recommendedKeep: sorted[0], records: sorted };
  });
}

export async function GET(request) {
  try { requireAdmin(request); } catch { return NextResponse.json({ error: "Non autorisé." }, { status: 401 }); }
  try {
    const db = getAdminDb();
    const [authUsers, userDocs, applications, restaurants] = await Promise.all([
      getAdminAuth().listUsers(1000),
      db.collection("users").get(),
      db.collection("driverApplications").get(),
      db.collection("restaurants").get(),
    ]);
    const profiles = new Map(userDocs.docs.map((doc) => [doc.id, { id: doc.id, ...doc.data(), authEmail: authUsers.users.find((user) => user.uid === doc.id)?.email || null }]));
    const applicationRows = applications.docs.map((doc) => ({ id: doc.id, ...doc.data(), profile: profiles.get(doc.id) || null }));
    const userRows = [...profiles.values()];
    const restaurantsByOwner = new Map();
    restaurants.docs.forEach((doc) => { const row = { id: doc.id, ...doc.data() }; const key = row.ownerId || `restaurant:${row.slug || doc.id}`; if (!restaurantsByOwner.has(key)) restaurantsByOwner.set(key, []); restaurantsByOwner.get(key).push(row); });
    const restaurantGroups = [...restaurantsByOwner.entries()].filter(([, rows]) => rows.length > 1).map(([ownerId, records]) => ({ category: "restaurants", ownerId, records }));
    return NextResponse.json({ generatedAt: new Date().toISOString(), warning: "Rapport en lecture seule. Aucune suppression n’est effectuée.", groups: [...duplicateGroups(userRows, "users"), ...duplicateGroups(applicationRows, "driverApplications"), ...restaurantGroups], counts: { users: userRows.length, driverApplications: applicationRows.length, restaurants: restaurants.size, duplicateGroups: duplicateGroups(userRows, "users").length + duplicateGroups(applicationRows, "driverApplications").length + restaurantGroups.length } });
  } catch (error) { return NextResponse.json({ error: error.message || "Audit impossible." }, { status: 500 }); }
}
