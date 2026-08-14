import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "../../../lib/firebaseAdmin";

export const runtime = "nodejs";
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });

export async function POST(request) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  try {
    const actor = await getAdminAuth().verifyIdToken(authorization.slice(7));
    const { restaurantId, menuItemId, publicId, resourceType = "image" } = await request.json();
    if (!restaurantId || !menuItemId || !publicId) return NextResponse.json({ ok: true });
    const restaurant = await getAdminDb().collection("restaurants").doc(String(restaurantId)).get();
    if (!restaurant.exists || restaurant.data()?.ownerId !== actor.uid) return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
    const item = await restaurant.ref.collection("menuItems").doc(String(menuItemId)).get();
    const itemData = item.data() || {};
    let cloudinaryPublicId = itemData.imagePublicId;
    if (!item.exists || (publicId !== itemData.imagePublicId && publicId !== itemData.imageUrl)) return NextResponse.json({ error: "Média introuvable." }, { status: 404 });
    if (!cloudinaryPublicId && itemData.imageUrl) {
      const uploadedPath = itemData.imageUrl.split("/upload/")[1]?.split("?")[0];
      cloudinaryPublicId = uploadedPath?.replace(/^v\d+\//, "").replace(/\.[^/.]+$/, "");
    }
    if (!cloudinaryPublicId) return NextResponse.json({ ok: true });
    await cloudinary.uploader.destroy(cloudinaryPublicId, { resource_type: resourceType });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Impossible de supprimer le média." }, { status: 500 });
  }
}
