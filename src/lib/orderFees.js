export function getMiamgoOrderFee(foodSubtotal, paidOrderCount = 0) {
  if (paidOrderCount < 5) return 0;
  if (foodSubtotal <= 2000) return 100;
  if (foodSubtotal <= 10000) return 150;
  return 200;
}

export function splitOrderAmount({ foodSubtotal, deliveryFee = 0, courierShare = 0, paidOrderCount = 0 }) {
  const platformFee = getMiamgoOrderFee(foodSubtotal, paidOrderCount);
  return {
    foodSubtotal,
    deliveryFee,
    platformFee,
    feeExempt: paidOrderCount < 5,
    paidOrderCount,
    courierShare: Math.max(0, Math.min(deliveryFee, courierShare)),
    restaurantShare: foodSubtotal,
    total: foodSubtotal + deliveryFee + platformFee,
  };
}
