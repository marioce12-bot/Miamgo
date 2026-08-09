export const COLLECTIONS = {
  users: "users",
  restaurants: "restaurants",
  dishes: "dishes",
  orders: "orders",
  internalCouriers: "internalCouriers",
  independentCouriers: "independentCouriers",
  deliveryAgencies: "deliveryAgencies",
  publications: "publications",
  subscriptions: "subscriptions",
} as const;

export const SUBCOLLECTIONS = {
  comments: "comments",
  likes: "likes",
  deliveryHistory: "deliveryHistory",
} as const;
