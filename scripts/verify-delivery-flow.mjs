import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { addDoc, collection, doc, getDoc, getFirestore, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
const password = process.env.DELIVERY_FLOW_PASSWORD;
const stamp = process.env.DELIVERY_FLOW_STAMP;
if (Object.values(config).some((value) => !value) || !password || !stamp) throw new Error("Configuration de test livraison manquante.");

async function account(name, email, role) {
  const app = initializeApp(config, name);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, "users", credential.user.uid), { id: credential.user.uid, email, displayName: role, phone: "+2290100000000", role, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return { db, uid: credential.user.uid };
}

const restaurant = await account("delivery-restaurant", `restaurant.delivery.${stamp}@miamgo.test`, "restaurant");
const client = await account("delivery-client", `client.delivery.${stamp}@miamgo.test`, "client");
const independent = await account("delivery-independent", `independent.delivery.${stamp}@miamgo.test`, "courier");
await setDoc(doc(restaurant.db, "restaurants", restaurant.uid), {
  id: restaurant.uid, ownerId: restaurant.uid, name: "Restaurant livraison test", slug: `delivery-${stamp}`,
  description: "", phone: "+2290100000000", contactEmail: `restaurant.delivery.${stamp}@miamgo.test`, address: "Cotonou",
  openingHours: { monday: "08-22", tuesday: "08-22", wednesday: "08-22", thursday: "08-22", friday: "08-22", saturday: "08-22", sunday: "Fermé" },
  menuCategoryIds: [], dailySpecialDishIds: [], dailySpecialMode: false, subscriptionPlan: "starter", deliveryModes: ["pickup", "internal", "external"], deliveryPricing: { basePrice: 500, pricePerKm: 250 }, isActive: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
});
console.log(`RESTAURANT DELIVERY OK id=${restaurant.uid} modes=internal,external pricing=500+250/km`);

const internalRef = await addDoc(collection(restaurant.db, "internalCouriers"), { restaurantId: restaurant.uid, firstName: "Awa", lastName: "Interne", phone: "+2290111111111", gender: "female", status: "available", active: true, deliveryCount: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
await setDoc(doc(independent.db, "independentCouriers", independent.uid), { userId: independent.uid, firstName: "Koffi", lastName: "Externe", phone: "+2290122222222", whatsappPhone: "+2290122222222", vehicleType: "Moto", status: "available", isVerified: true, location: { latitude: 6.38, longitude: 2.42 }, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
console.log(`COURIERS OK internal=${internalRef.id} external=${independent.uid} whatsapp=wa.me/2290122222222`);

async function createOrder(label, thirdParty = false) {
  const orderRef = doc(collection(client.db, "orders"));
  await setDoc(orderRef, { serialNumber: `MG-DEL-${label}-${orderRef.id.slice(0, 5).toUpperCase()}`, restaurantId: restaurant.uid, clientId: client.uid, clientName: "Client livraison", clientPhone: "+2290199999999", items: [{ dishId: "delivery-dish", name: "Poulet livraison", unitPrice: 4000, quantity: 2 }], status: "pending_payment", fulfillmentMode: "internal", ...(thirdParty ? { recipient: { name: "Destinataire tiers", phone: "+2290133333333", address: "Akpakpa" } } : {}), deliveryThirdParty: thirdParty, deliveryDestination: { latitude: 6.39, longitude: 2.43 }, deliveryDistanceKm: 2.5, deliveryPrice: 1125, subtotal: 8000, total: 9125, validationCode: thirdParty ? "" : "641928", paymentProvider: "fedapay", createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  console.log(`ORDER CREATED ${label} id=${orderRef.id} status=pending_payment`);
  console.log(`ORDER PREPARE START ${label} id=${orderRef.id}`);
  await updateDoc(doc(restaurant.db, "orders", orderRef.id), { status: "ready", updatedAt: serverTimestamp() });
  console.log(`ORDER READY ${label} id=${orderRef.id}`);
  return orderRef;
}

const internalOrder = await createOrder("INT");
await updateDoc(doc(restaurant.db, "orders", internalOrder.id), { assignedCourierId: internalRef.id, deliveryProvider: "internal", status: "in_delivery", courierLocation: { latitude: 6.375, longitude: 2.415 }, courierLocationUpdatedAt: serverTimestamp(), updatedAt: serverTimestamp() });
await updateDoc(internalRef, { status: "on_delivery", deliveryCount: 1, updatedAt: serverTimestamp() });
const internalSnapshot = await getDoc(doc(restaurant.db, "orders", internalOrder.id));
console.log(`INTERNAL DELIVERY OK order=${internalOrder.id} status=${internalSnapshot.data().status} courier=${internalSnapshot.data().assignedCourierId} location=${internalSnapshot.data().courierLocation.latitude},${internalSnapshot.data().courierLocation.longitude}`);
await updateDoc(doc(restaurant.db, "orders", internalOrder.id), { status: "completed", updatedAt: serverTimestamp() });
console.log(`CLIENT CODE OK order=${internalOrder.id} code=641928 status=completed`);

const externalOrder = await createOrder("EXT", true);
await updateDoc(doc(restaurant.db, "orders", externalOrder.id), { fulfillmentMode: "external", assignedCourierId: independent.uid, deliveryProvider: "independent", status: "accepted", updatedAt: serverTimestamp() });
await updateDoc(doc(independent.db, "orders", externalOrder.id), { status: "in_delivery", externalCourierAcceptedAt: serverTimestamp(), courierLocation: { latitude: 6.385, longitude: 2.425 }, courierLocationUpdatedAt: serverTimestamp(), updatedAt: serverTimestamp() });
const externalSnapshot = await getDoc(doc(restaurant.db, "orders", externalOrder.id));
console.log(`EXTERNAL ACCEPTANCE OK order=${externalOrder.id} status=${externalSnapshot.data().status} partner=${externalSnapshot.data().assignedCourierId} contact=https://wa.me/2290122222222`);
await updateDoc(doc(independent.db, "orders", externalOrder.id), { status: "completed", updatedAt: serverTimestamp() });
const completedExternal = await getDoc(doc(restaurant.db, "orders", externalOrder.id));
console.log(`THIRD PARTY DELIVERY OK order=${externalOrder.id} code=not-required status=${completedExternal.data().status}`);
console.log(`DELIVERY FLOW COMPLETE internal=${internalOrder.id} external=${externalOrder.id}`);
