import { collection, doc, onSnapshot, serverTimestamp, setDoc, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Coordinates, Order, OrderItem } from "@/lib/firestore/models";
import { createOrderSerial } from "@/lib/restaurant/order-utils";

function database() { if (!db) throw new Error("Firebase n'est pas configuré."); return db; }

export interface CheckoutInput {
  restaurantId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  items: OrderItem[];
  fulfillmentMode: "pickup" | "internal" | "external";
  recipient?: { name: string; phone: string; address: string };
  destination?: Coordinates;
  distanceKm?: number;
  deliveryPrice: number;
  paymentMethod: "fedapay" | "cash";
}

export async function createClientOrder(input: CheckoutInput): Promise<Order> {
  const reference = doc(collection(database(), "orders"));
  const subtotal = input.items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  const cash = input.paymentMethod === "cash";
  const validationCode = String(Math.floor(100000 + Math.random() * 900000));
  const order = {
    id: reference.id,
    serialNumber: createOrderSerial(),
    restaurantId: input.restaurantId,
    clientId: input.clientId,
    clientName: input.clientName,
    clientPhone: input.clientPhone,
    items: input.items,
    status: cash ? "paid" : "pending_payment",
    fulfillmentMode: input.fulfillmentMode,
    ...(input.recipient ? { recipient: input.recipient, deliveryThirdParty: true } : {}),
    ...(input.destination ? { deliveryDestination: input.destination } : {}),
    ...(input.distanceKm !== undefined ? { deliveryDistanceKm: input.distanceKm } : {}),
    deliveryPrice: input.deliveryPrice,
    subtotal,
    total: subtotal + input.deliveryPrice,
    validationCode,
    paymentProvider: "fedapay" as const,
    paymentMethod: input.paymentMethod,
    paymentStatus: cash ? "cash_due" : "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(reference, order);
  return order as Order;
}

export function subscribeClientOrders(clientId: string, callback: (orders: Order[]) => void): Unsubscribe {
  return onSnapshot(collection(database(), "orders"), (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Order).filter((order) => order.clientId === clientId).sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))));
}
