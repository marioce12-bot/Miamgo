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

export async function createRestaurant(ownerId, restaurant) {
  const { db, doc, serverTimestamp, setDoc } = await firestore();
  const restaurantRef = doc(db, "restaurants", restaurant.slug);
  await setDoc(restaurantRef, {
    ...restaurant,
    ownerId,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
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

export function serialiseCartItem(item) {
  return { id: item.id, name: item.name, price: item.price, quantity: item.quantity || 1 };
}
