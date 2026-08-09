import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { DeliveryAgency, Dish, IndependentCourier, InternalCourier, Order, OrderStatus, Restaurant } from "@/lib/firestore/models";
import { parsePickupQrValue } from "./order-utils";

function database() {
  if (!db) throw new Error("Firebase n'est pas configuré.");
  return db;
}

export function subscribeRestaurant(
  restaurantId: string,
  callback: (restaurant: Restaurant | null) => void,
): Unsubscribe {
  return onSnapshot(doc(database(), "restaurants", restaurantId), (snapshot) => {
    callback(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Restaurant) : null);
  });
}

export async function saveRestaurant(
  restaurantId: string,
  values: Partial<Restaurant>,
): Promise<void> {
  await setDoc(
    doc(database(), "restaurants", restaurantId),
    {
      id: restaurantId,
      ownerId: restaurantId,
      ...values,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function subscribeDishes(
  restaurantId: string,
  callback: (dishes: Dish[]) => void,
): Unsubscribe {
  const dishesQuery = query(
    collection(database(), "dishes"),
    where("restaurantId", "==", restaurantId),
  );
  return onSnapshot(dishesQuery, (snapshot) => {
    callback(
      snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }) as Dish)
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  });
}

export async function createDish(
  restaurantId: string,
  values: Omit<Dish, "id" | "restaurantId" | "createdAt" | "updatedAt">,
): Promise<string> {
  const reference = await addDoc(collection(database(), "dishes"), {
    ...values,
    restaurantId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return reference.id;
}

export async function updateDish(dishId: string, values: Partial<Dish>): Promise<void> {
  const { id: _id, restaurantId: _restaurantId, createdAt: _createdAt, ...safeValues } = values;
  void _id;
  void _restaurantId;
  void _createdAt;
  await updateDoc(doc(database(), "dishes", dishId), {
    ...safeValues,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDish(dishId: string): Promise<void> {
  await deleteDoc(doc(database(), "dishes", dishId));
}

export function subscribeOrders(
  restaurantId: string,
  callback: (orders: Order[]) => void,
): Unsubscribe {
  const ordersQuery = query(
    collection(database(), "orders"),
    where("restaurantId", "==", restaurantId),
  );
  return onSnapshot(ordersQuery, (snapshot) => {
    callback(
      snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }) as Order)
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)),
    );
  });
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  await updateDoc(doc(database(), "orders", orderId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeInternalCouriers(
  restaurantId: string,
  callback: (couriers: InternalCourier[]) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(database(), "internalCouriers"), where("restaurantId", "==", restaurantId)),
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as InternalCourier)),
  );
}

export async function createInternalCourier(
  restaurantId: string,
  values: Pick<InternalCourier, "firstName" | "lastName" | "phone" | "gender">,
): Promise<string> {
  const reference = await addDoc(collection(database(), "internalCouriers"), {
    ...values,
    restaurantId,
    status: "available",
    active: true,
    deliveryCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return reference.id;
}

export async function deactivateInternalCourier(courierId: string): Promise<void> {
  await updateDoc(doc(database(), "internalCouriers", courierId), {
    active: false,
    status: "offline",
    updatedAt: serverTimestamp(),
  });
}

export function subscribeExternalPartners(callback: (partners: Array<IndependentCourier | DeliveryAgency>) => void): Unsubscribe {
  let independent: IndependentCourier[] = [];
  let agencies: DeliveryAgency[] = [];
  const publish = () => callback([...independent, ...agencies]);
  const stopIndependent = onSnapshot(
    query(collection(database(), "independentCouriers"), where("status", "==", "available")),
    (snapshot) => { independent = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as IndependentCourier); publish(); },
  );
  const stopAgencies = onSnapshot(
    query(collection(database(), "deliveryAgencies"), where("status", "==", "available")),
    (snapshot) => { agencies = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as DeliveryAgency); publish(); },
  );
  return () => { stopIndependent(); stopAgencies(); };
}

export async function assignInternalDelivery(orderId: string, courier: InternalCourier): Promise<void> {
  await updateDoc(doc(database(), "orders", orderId), {
    assignedCourierId: courier.userId ?? courier.id,
    deliveryProvider: "internal",
    status: "in_delivery",
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(database(), "internalCouriers", courier.id), {
    status: "on_delivery",
    deliveryCount: (courier.deliveryCount ?? 0) + 1,
    updatedAt: serverTimestamp(),
  });
}

export async function assignExternalDelivery(
  orderId: string,
  partner: IndependentCourier | DeliveryAgency,
): Promise<void> {
  const isAgency = "ownerId" in partner;
  await updateDoc(doc(database(), "orders", orderId), {
    assignedCourierId: partner.id,
    deliveryProvider: isAgency ? "agency" : "independent",
    status: "accepted",
    updatedAt: serverTimestamp(),
  });
}

export async function acceptExternalDelivery(orderId: string): Promise<void> {
  await updateDoc(doc(database(), "orders", orderId), {
    status: "in_delivery",
    externalCourierAcceptedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateCourierLocation(orderId: string, latitude: number, longitude: number): Promise<void> {
  await updateDoc(doc(database(), "orders", orderId), {
    courierLocation: { latitude, longitude },
    courierLocationUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function validateClientDelivery(orderId: string, validationCode: string): Promise<boolean> {
  const reference = doc(database(), "orders", orderId);
  const snapshot = await getDoc(reference);
  if (!snapshot.exists()) throw new Error("Commande introuvable.");
  const order = snapshot.data() as Order;
  if (order.deliveryThirdParty) {
    await updateDoc(reference, { status: "completed", updatedAt: serverTimestamp() });
    return true;
  }
  if (order.validationCode !== validationCode) return false;
  await updateDoc(reference, { status: "completed", updatedAt: serverTimestamp() });
  return true;
}

export async function markOrderPickedUpByQr(
  restaurantId: string,
  qrValue: string,
): Promise<Order> {
  const payload = parsePickupQrValue(qrValue);
  const reference = doc(database(), "orders", payload.orderId);
  const snapshot = await getDoc(reference);

  if (!snapshot.exists()) throw new Error("Commande introuvable.");
  const order = { id: snapshot.id, ...snapshot.data() } as Order;
  if (order.restaurantId !== restaurantId) throw new Error("Cette commande appartient à un autre restaurant.");
  if (order.fulfillmentMode !== "pickup") throw new Error("Cette commande n'est pas un retrait sur place.");
  if (order.validationCode !== payload.validationCode) throw new Error("Code de validation incorrect.");
  if (order.status !== "ready") throw new Error("La commande doit être prête avant le retrait.");

  await updateDoc(reference, {
    status: "picked_up",
    pickedUpAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { ...order, status: "picked_up" };
}
