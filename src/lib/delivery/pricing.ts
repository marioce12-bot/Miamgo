import type { Coordinates, DeliveryPricing } from "@/lib/firestore/models";

const EARTH_RADIUS_KM = 6371;

function radians(value: number): number {
  return (value * Math.PI) / 180;
}

export function distanceInKm(from: Coordinates, to: Coordinates): number {
  const latitude = radians(to.latitude - from.latitude);
  const longitude = radians(to.longitude - from.longitude);
  const a =
    Math.sin(latitude / 2) ** 2 +
    Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(longitude / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export function deliveryQuote(
  from: Coordinates,
  to: Coordinates,
  pricing: DeliveryPricing,
): { distanceKm: number; price: number } {
  const distanceKm = Math.round(distanceInKm(from, to) * 10) / 10;
  return { distanceKm, price: Math.round(pricing.basePrice + distanceKm * pricing.pricePerKm) };
}
