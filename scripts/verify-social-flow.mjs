import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { collection, doc, getDocs, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
const stamp = process.env.SOCIAL_FLOW_STAMP;
const password = process.env.SOCIAL_FLOW_PASSWORD;
if (Object.values(config).some((value) => !value) || !stamp || !password) throw new Error("Configuration de test social manquante.");

async function createAccount(name, email, role) {
  const app = initializeApp(config, name);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, "users", credential.user.uid), { id: credential.user.uid, email, displayName: role, role, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return { db, uid: credential.user.uid };
}

const restaurant = await createAccount("social-restaurant", `restaurant.social.${stamp}@miamgo.test`, "restaurant");
const client = await createAccount("social-client", `client.social.${stamp}@miamgo.test`, "client");
await setDoc(doc(restaurant.db, "restaurants", restaurant.uid), { id: restaurant.uid, ownerId: restaurant.uid, name: "Restaurant Social Test", slug: `social-${stamp}`, description: "", phone: "+2290100000000", contactEmail: `restaurant.social.${stamp}@miamgo.test`, address: "Cotonou", openingHours: { monday: "08-22", tuesday: "08-22", wednesday: "08-22", thursday: "08-22", friday: "08-22", saturday: "08-22", sunday: "Fermé" }, menuCategoryIds: [], dailySpecialDishIds: [], dailySpecialMode: false, subscriptionPlan: "starter", deliveryModes: ["pickup"], isActive: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
const postRef = doc(collection(restaurant.db, "publications"));
await setDoc(postRef, { restaurantId: restaurant.uid, imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80", text: "Publication de test : notre poulet braisé est prêt ce soir.", likeCount: 0, commentCount: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
console.log(`POST CREATED id=${postRef.id} restaurant=${restaurant.uid}`);
const feed = await getDocs(collection(client.db, "publications"));
if (!feed.docs.some((item) => item.id === postRef.id)) throw new Error("Publication absente du fil client.");
console.log(`FEED VISIBLE post=${postRef.id} count=${feed.size}`);
await setDoc(doc(client.db, "publications", postRef.id, "likes", client.uid), { userId: client.uid, createdAt: serverTimestamp() });
const commentRef = doc(collection(client.db, "publications", postRef.id, "comments"));
await setDoc(commentRef, { userId: client.uid, text: "Je réserve pour ce soir !", createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
const likes = await getDocs(collection(restaurant.db, "publications", postRef.id, "likes"));
const comments = await getDocs(collection(restaurant.db, "publications", postRef.id, "comments"));
if (likes.size !== 1 || comments.size !== 1) throw new Error("Interactions absentes côté restaurant.");
console.log(`LIKE OK post=${postRef.id} client=${client.uid} count=${likes.size}`);
console.log(`COMMENT OK post=${postRef.id} text="Je réserve pour ce soir !" count=${comments.size}`);
console.log(`SOCIAL FLOW COMPLETE post=${postRef.id} restaurant=${restaurant.uid} client=${client.uid}`);
