import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
const restaurantEmail = process.env.RESTAURANT_FLOW_RESTAURANT_EMAIL;
const clientEmail = process.env.RESTAURANT_FLOW_CLIENT_EMAIL;
const password = process.env.RESTAURANT_FLOW_PASSWORD;

if (Object.values(config).some((value) => !value) || !restaurantEmail || !clientEmail || !password) {
  throw new Error("Configuration Firebase ou comptes de parcours manquants.");
}

const restaurantApp = initializeApp(config, "restaurant-flow-restaurant");
const clientApp = initializeApp(config, "restaurant-flow-client");
const restaurantAuth = getAuth(restaurantApp);
const clientAuth = getAuth(clientApp);
const restaurantDb = getFirestore(restaurantApp);
const clientDb = getFirestore(clientApp);

const restaurantCredential = await createUserWithEmailAndPassword(restaurantAuth, restaurantEmail, password);
const restaurantId = restaurantCredential.user.uid;
await setDoc(doc(restaurantDb, "users", restaurantId), {
  id: restaurantId,
  email: restaurantEmail,
  displayName: "Restaurant Parcours F-REST",
  phone: "+229 0100000000",
  role: "restaurant",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
console.log(`USER FIRESTORE OK id=${restaurantId} role=restaurant`);
console.log(`RESTAURANT CREATE START id=${restaurantId}`);
await setDoc(doc(restaurantDb, "restaurants", restaurantId), {
  id: restaurantId,
  ownerId: restaurantId,
  name: "Restaurant Parcours F-REST",
  slug: `restaurant-parcours-${restaurantId.slice(0, 6).toLowerCase()}`,
  description: "Restaurant créé par le test de parcours complet.",
  phone: "+229 0100000000",
  contactEmail: restaurantEmail,
  address: "Cotonou, Bénin",
  openingHours: {
    monday: "08:00 - 22:00", tuesday: "08:00 - 22:00",
    wednesday: "08:00 - 22:00", thursday: "08:00 - 22:00",
    friday: "08:00 - 23:00", saturday: "08:00 - 23:00", sunday: "Fermé",
  },
  menuCategoryIds: ["plats"],
  dailySpecialDishIds: [],
  dailySpecialMode: false,
  subscriptionPlan: "starter",
  deliveryModes: ["pickup"],
  isActive: true,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
console.log(`RESTAURANT OK id=${restaurantId} email=${restaurantEmail}`);

const dishReference = await addDoc(collection(restaurantDb, "dishes"), {
  restaurantId,
  name: "Poulet braisé test",
  description: "Plat créé par le test F-REST.",
  photoUrl: "https://i.ibb.co/miamgo-test/poulet-braise.jpg",
  price: 4500,
  promotionPrice: 4000,
  promotionDate: new Date().toISOString().slice(0, 10),
  category: "Plats",
  available: true,
  isDailySpecial: true,
  dailySpecialDate: new Date().toISOString().slice(0, 10),
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
await updateDoc(doc(restaurantDb, "restaurants", restaurantId), {
  dailySpecialDishIds: [dishReference.id],
  dailySpecialMode: true,
  updatedAt: serverTimestamp(),
});
const dishSnapshot = await getDoc(dishReference);
if (!dishSnapshot.exists() || dishSnapshot.data().name !== "Poulet braisé test") {
  throw new Error("Le plat test n'est pas lisible dans Firestore.");
}
console.log(`DISH FIRESTORE OK id=${dishReference.id} name=${dishSnapshot.data().name} available=${dishSnapshot.data().available} promo=${dishSnapshot.data().promotionPrice}`);

const clientCredential = await createUserWithEmailAndPassword(clientAuth, clientEmail, password);
const clientId = clientCredential.user.uid;
await setDoc(doc(clientDb, "users", clientId), {
  id: clientId,
  email: clientEmail,
  displayName: "Client Parcours F-REST",
  phone: "+229 0199999999",
  role: "client",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

const ordersQuery = query(collection(restaurantDb, "orders"), where("restaurantId", "==", restaurantId));
let listenerResolve;
let listenerReject;
const listenerResult = new Promise((resolve, reject) => { listenerResolve = resolve; listenerReject = reject; });
const timeout = setTimeout(() => listenerReject(new Error("Le listener n'a pas reçu la commande en cours.")), 15000);
const unsubscribe = onSnapshot(
  ordersQuery,
  (snapshot) => {
    const paidOrder = snapshot.docs.find((item) => item.data().status === "paid");
    if (paidOrder) listenerResolve(paidOrder.id);
  },
  listenerReject,
);

const orderReference = doc(collection(clientDb, "orders"));
const validationCode = "482731";
const serialNumber = `MG-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${orderReference.id.slice(0, 6).toUpperCase()}`;
await setDoc(orderReference, {
  serialNumber,
  restaurantId,
  clientId,
  clientName: "Client Parcours F-REST",
  clientPhone: "+229 0199999999",
  items: [{ dishId: dishReference.id, name: "Poulet braisé test", unitPrice: 4000, quantity: 2 }],
  status: "pending_payment",
  fulfillmentMode: "pickup",
  deliveryPrice: 0,
  subtotal: 8000,
  total: 8000,
  validationCode,
  paymentProvider: "fedapay",
  paymentTransactionId: "test-f-rest",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
await updateDoc(doc(restaurantDb, "orders", orderReference.id), { status: "paid", updatedAt: serverTimestamp() });
const listenerOrderId = await listenerResult;
clearTimeout(timeout);
unsubscribe();
console.log(`ORDER LISTENER OK id=${listenerOrderId} serial=${serialNumber} items=2 status=paid section=Commandes en cours`);

await updateDoc(doc(restaurantDb, "orders", orderReference.id), { status: "ready", updatedAt: serverTimestamp() });
const qrValue = `miamgo:${orderReference.id}:${validationCode}`;
const [scheme, scannedOrderId, scannedCode] = qrValue.split(":");
if (scheme !== "miamgo" || scannedOrderId !== orderReference.id || scannedCode !== validationCode) {
  throw new Error("Le scan QR test est invalide.");
}
const beforePickup = await getDoc(doc(restaurantDb, "orders", scannedOrderId));
if (beforePickup.data()?.validationCode !== scannedCode || beforePickup.data()?.status !== "ready") {
  throw new Error("Le QR ne correspond pas à une commande prête.");
}
await updateDoc(doc(restaurantDb, "orders", scannedOrderId), {
  status: "picked_up",
  pickedUpAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
const afterPickup = await getDoc(doc(restaurantDb, "orders", scannedOrderId));
if (afterPickup.data()?.status !== "picked_up") throw new Error("La commande n'est pas passée en retrait.");
console.log(`QR PICKUP OK value=${qrValue} serial=${serialNumber} status=${afterPickup.data().status}`);
console.log(`FLOW COMPLETE restaurant=${restaurantId} dish=${dishReference.id} order=${orderReference.id}`);
