export function getMiamgoOrderFee(foodSubtotal) {
  if (foodSubtotal <= 2000) return 100;
  if (foodSubtotal <= 10000) return 150;
  return 200;
}

export function splitOrderAmount({ foodSubtotal, deliveryFee = 0, courierShare = 0 }) {
  const platformFee = getMiamgoOrderFee(foodSubtotal);
  return {
    foodSubtotal,
    deliveryFee,
    platformFee,
    courierShare: Math.max(0, Math.min(deliveryFee, courierShare)),
    restaurantShare: foodSubtotal,
    total: foodSubtotal + deliveryFee + platformFee,
  };
}
