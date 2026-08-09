import type { GeoPoint, Timestamp } from "firebase/firestore";

export type UserRole =
  | "client"
  | "restaurant"
  | "courier"
  | "agency"
  | "admin";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  searchHistory?: string[];
  role: UserRole;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type RestaurantPlan = "starter" | "growth" | "premium";
export type DeliveryMode = "pickup" | "internal" | "external";
export type DeliveryProvider = "internal" | "independent" | "agency";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DeliveryPricing {
  basePrice: number;
  pricePerKm: number;
}

export interface OpeningHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface Restaurant {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string;
  logoUrl?: string;
  coverUrl?: string;
  phone: string;
  contactEmail: string;
  address: string;
  location?: GeoPoint;
  openingHours: OpeningHours;
  menuCategoryIds: string[];
  dailySpecialDishIds: string[];
  dailySpecialMode: boolean;
  subscriptionPlan: RestaurantPlan;
  deliveryModes: DeliveryMode[];
  internalDeliveryBasePrice?: number;
  deliveryPricing?: DeliveryPricing;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Dish {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  photoUrl: string;
  price: number;
  promotionPrice?: number;
  promotionDate?: string;
  category: string;
  available: boolean;
  isDailySpecial: boolean;
  dailySpecialDate?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface OrderItem {
  dishId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
}

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "accepted"
  | "preparing"
  | "ready"
  | "in_delivery"
  | "picked_up"
  | "completed"
  | "cancelled";

export interface OrderRecipient {
  name: string;
  phone: string;
  address?: string;
  location?: GeoPoint;
}

export interface Order {
  id: string;
  serialNumber: string;
  restaurantId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  items: OrderItem[];
  status: OrderStatus;
  fulfillmentMode: DeliveryMode;
  recipient?: OrderRecipient;
  deliveryProvider?: DeliveryProvider;
  deliveryThirdParty?: boolean;
  deliveryDistanceKm?: number;
  deliveryDestination?: Coordinates;
  courierLocation?: Coordinates;
  courierLocationUpdatedAt?: Timestamp;
  externalCourierAcceptedAt?: Timestamp;
  deliveryPrice: number;
  subtotal: number;
  total: number;
  validationCode: string;
  assignedCourierId?: string;
  paymentProvider: "fedapay";
  paymentMethod?: "fedapay" | "cash";
  paymentStatus?: "pending" | "paid" | "cash_due" | "failed";
  paymentTransactionId?: string;
  pickedUpAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CourierStatus = "available" | "on_delivery" | "offline";

export interface InternalCourier {
  id: string;
  userId?: string;
  restaurantId: string;
  firstName: string;
  lastName: string;
  phone: string;
  gender: "female" | "male" | "other";
  status: CourierStatus;
  active: boolean;
  deliveryCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface IndependentCourier {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  gender?: "female" | "male" | "other";
  vehicleType: string;
  status: CourierStatus;
  isVerified: boolean;
  whatsappPhone?: string;
  location?: Coordinates;
  deliveryCount?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DeliveryAgency {
  id: string;
  ownerId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  status: "available" | "unavailable";
  whatsappPhone?: string;
  location?: Coordinates;
  subscriptionId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DeliveryHistoryEntry {
  id: string;
  orderId: string;
  courierId: string;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  distanceKm?: number;
  deliveryPrice: number;
}

export interface Publication {
  id: string;
  restaurantId: string;
  imageUrl: string;
  text: string;
  likeCount: number;
  commentCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PublicationLike {
  userId: string;
  createdAt: Timestamp;
}

export interface PublicationComment {
  id: string;
  userId: string;
  text: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type SubscriptionPlan =
  | RestaurantPlan
  | "delivery_agency";

export interface Subscription {
  id: string;
  entityId: string;
  entityType: "restaurant" | "delivery_agency";
  plan: SubscriptionPlan;
  paymentStatus: "pending" | "paid" | "failed" | "expired";
  fedapayTransactionId?: string;
  startsAt: Timestamp;
  expiresAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
