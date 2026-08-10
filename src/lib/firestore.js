import { firebaseApp } from "./firebase";

async function firestore() {
  const api = await import("firebase/firestore");
  return { ...api, db: api.getFirestore(firebaseApp) };
}

export async function ensureCustomerProfile(user) {
  const { db, doc, getDoc, serverTimestamp, setDoc } = await firestore();
  const profileRef = doc(db, "users", user.uid);
  const profile = await getDoc(profileRef);

  if (!profile.exists()) {
    await setDoc(profileRef, {
      displayName: user.email?.split("@")[0] || "Client Miamgo",
      email: user.email || null,
      role: "client",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function getUserProfile(userId) {
  const { db, doc, getDoc } = await firestore();
  const snapshot = await getDoc(doc(db, "users", userId));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function getOwnedRestaurant(userId) {
  const { collection, db, getDocs, limit, query, where } = await firestore();
  const snapshot = await getDocs(query(collection(db, "restaurants"), where("ownerId", "==", userId), limit(1)));
  return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

export async function registerProfile(user, profile) {
  const { db, doc, serverTimestamp, setDoc } = await firestore();
  const profileRef = doc(db, "users", user.uid);
  await setDoc(profileRef, {
    displayName: profile.displayName,
    email: profile.email || user.email || null,
    phone: profile.phone || null,
    country: profile.country || "BJ",
    city: profile.city || "Cotonou",
    role: profile.role,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function getDriverApplication(userId) {
  const { db, doc, getDoc } = await firestore();
  const snapshot = await getDoc(doc(db, "driverApplications", userId));
  return snapshot.exists() ? snapshot.data() : null;
}

export function explainFirestoreError(error) {
  if (error?.code === "permission-denied") return "Firestore a refusé l'écriture. Publiez les règles Firestore actuelles, puis réessayez avec le même e-mail et mot de passe.";
  if (error?.code === "failed-precondition") return "Cloud Firestore n'est pas activé dans le projet miamgo-2479d. Activez Firestore Database dans Firebase Console.";
  if (error?.code === "unavailable") return "Firestore est indisponible ou la connexion Internet est interrompue.";
  return `Impossible d'enregistrer les données Firestore${error?.code ? ` (${error.code})` : ""}.`;
}

export async function updateProfileSettings(userId, changes) {
  const { db, doc, serverTimestamp, setDoc } = await firestore();
  await setDoc(doc(db, "users", userId), { ...changes, updatedAt: serverTimestamp() }, { merge: true });
}

export async function saveRestaurantIdentity(restaurantId, changes) {
  const { db, doc, serverTimestamp, setDoc } = await firestore();
  await setDoc(doc(db, "restaurants", restaurantId), { ...changes, updatedAt: serverTimestamp() }, { merge: true });
}

export async function savePayoutDetails(collectionName, id, details) {
  const { db, doc, serverTimestamp, setDoc } = await firestore();
  await setDoc(doc(db, collectionName, id), { payoutDetails: details, payoutStatus: "pending_verification", updatedAt: serverTimestamp() }, { merge: true });
}

export async function createRestaurantPost(ownerId, restaurantId, post) {
  const { addDoc, collection, db, serverTimestamp } = await firestore();
  return addDoc(collection(db, "posts"), {
    ...post,
    ownerId,
    restaurantId,
    likeCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function setPostLike(userId, postId, isLiked) {
  const { db, deleteDoc, doc, serverTimestamp, setDoc } = await firestore();
  const likeRef = doc(db, "posts", String(postId), "likes", userId);

  if (isLiked) {
    await setDoc(likeRef, { userId, createdAt: serverTimestamp() });
  } else {
    await deleteDoc(likeRef);
  }
}

export async function saveFavorite(userId, restaurantId, isSaved) {
  const { db, deleteDoc, doc, serverTimestamp, setDoc } = await firestore();
  const favoriteRef = doc(db, "favorites", `${userId}_${restaurantId}`);
  if (isSaved) {
    await setDoc(favoriteRef, { userId, restaurantId, createdAt: serverTimestamp() });
  } else {
    await deleteDoc(favoriteRef);
  }
}

export async function addCartItem(userId, item) {
  const { arrayUnion, db, doc, serverTimestamp, setDoc } = await firestore();
  const cartRef = doc(db, "carts", userId);
  await setDoc(cartRef, {
    userId,
    restaurantId: item.restaurant.toLowerCase().replaceAll(" ", "-"),
    items: arrayUnion({ id: item.id, name: item.dish, price: item.price, quantity: 1 }),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function addComment(userId, postId, content) {
  const { db, doc, serverTimestamp, setDoc } = await firestore();
  const commentRef = doc(db, "posts", String(postId), "comments", `${userId}_${Date.now()}`);
  await setDoc(commentRef, { userId, content, createdAt: serverTimestamp() });
}

export async function addRestaurantReply(userId, postId, commentId, content) {
  const { db, doc, serverTimestamp, setDoc } = await firestore();
  await setDoc(doc(db, "posts", String(postId), "comments", String(commentId), "replies", `${userId}_${Date.now()}`), { userId, content, createdAt: serverTimestamp() });
}

export async function createRestaurant(ownerId, restaurant) {
  const { db, doc, serverTimestamp, setDoc } = await firestore();
  const restaurantRef = doc(db, "restaurants", restaurant.slug);
  await setDoc(restaurantRef, {
    ...restaurant,
    ownerId,
    status: "pending",
    verificationStatus: "pending",
    subscriptionStatus: "locked",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateRestaurantPlan(restaurantId, plan) {
  const { db, doc, serverTimestamp, setDoc } = await firestore();
  await setDoc(doc(db, "restaurants", restaurantId), {
    plan,
    subscriptionStatus: "unpaid",
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function createOrder(customerId, order) {
  const { addDoc, collection, db, serverTimestamp } = await firestore();
  const serialNumber = `MG-${Date.now().toString().slice(-8)}`;
  const orderRef = await addDoc(collection(db, "orders"), {
    ...order,
    customerId,
    serialNumber,
    status: "pending",
    paymentStatus: "pending",
    itemCount: Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0) : 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: orderRef.id, serialNumber };
}

export async function createDriverApplication(userId, application) {
  const { db, doc, serverTimestamp, setDoc } = await firestore();
  await setDoc(doc(db, "driverApplications", userId), {
    ...application,
    userId,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function createDriverAffiliation(driverId, restaurantId, invitedBy = null) {
  const { db, doc, serverTimestamp, setDoc } = await firestore();
  const affiliationId = `${driverId}_${restaurantId}`;
  await setDoc(doc(db, "driverRestaurants", affiliationId), { driverId, restaurantId, invitedBy, status: "pending", createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
}

export async function publishDriverDirectory(userId, profile) {
  const { db, doc, serverTimestamp, setDoc } = await firestore();
  await setDoc(doc(db, "driverDirectory", userId), { driverId: userId, displayName: profile.displayName || "Livreur", photoURL: profile.photoURL || null, city: profile.city || null, country: profile.country || null, verificationStatus: profile.verificationStatus || "pending", subscriptionStatus: profile.subscriptionStatus || "locked", availabilityStatus: profile.availabilityStatus || "unavailable", updatedAt: serverTimestamp() }, { merge: true });
}

export async function getDriverGroupsForRestaurant(restaurantId) {
  const { collection, db, getDocs, query, where } = await firestore();
  const [affiliations, directory] = await Promise.all([
    getDocs(query(collection(db, "driverRestaurants"), where("restaurantId", "==", restaurantId))),
    getDocs(query(collection(db, "driverDirectory"), where("availabilityStatus", "==", "available"))),
  ]);
  const affiliatedIds = new Set(affiliations.docs.filter((item) => item.data().status === "active").map((item) => item.data().driverId));
  const drivers = directory.docs.map((item) => ({ id: item.id, ...item.data() }));
  return { affiliated: drivers.filter((driver) => affiliatedIds.has(driver.id)), platform: drivers.filter((driver) => !affiliatedIds.has(driver.id)) };
}

export function serialiseCartItem(item) {
  return { id: item.id, name: item.name, price: item.price, quantity: item.quantity || 1 };
}
