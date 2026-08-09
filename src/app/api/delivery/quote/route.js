import { NextResponse } from "next/server";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { haversineKm } from "../../../../lib/distance";

export const runtime = "nodejs";

export async function POST(request) {
  const input = await request.json();
  const customer = { latitude: Number(input.latitude), longitude: Number(input.longitude) };
  if (!Number.isFinite(customer.latitude) || !Number.isFinite(customer.longitude)) return NextResponse.json({ error: "Coordonnées client invalides." }, { status: 400 });
  const restaurantSnapshot = await getAdminDb().collection("restaurants").doc(String(input.restaurantId)).get();
  const restaurant = restaurantSnapshot.data();
  const origin = { latitude: Number(restaurant?.latitude), longitude: Number(restaurant?.longitude) };
  if (!Number.isFinite(origin.latitude) || !Number.isFinite(origin.longitude)) return NextResponse.json({ error: "Les coordonnées du restaurant ne sont pas configurées." }, { status: 422 });
  const pricingSnapshot = await getAdminDb().collection("settings").doc("deliveryPricing").get();
  const pricing = pricingSnapshot.exists ? pricingSnapshot.data() : {};
  const baseFee = Number(pricing.baseFee ?? process.env.DELIVERY_BASE_FEE);
  const perKm = Number(pricing.perKm ?? process.env.DELIVERY_RATE_PER_KM);
  const maxDistance = Number(pricing.maxDistanceKm ?? process.env.DELIVERY_MAX_DISTANCE_KM ?? 50);
  if (!Number.isFinite(baseFee) || !Number.isFinite(perKm)) return NextResponse.json({ error: "Tarification livraison non configurée." }, { status: 503 });
  const distanceKm = haversineKm(origin, customer);
  if (distanceKm > maxDistance) return NextResponse.json({ error: "Cette adresse est hors de la zone de livraison.", distanceKm }, { status: 422 });
  return NextResponse.json({ distanceKm: Number(distanceKm.toFixed(2)), deliveryFee: Math.ceil(baseFee + distanceKm * perKm), pricing: { baseFee, perKm, maxDistance } });
}
