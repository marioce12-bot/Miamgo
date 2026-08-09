import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const accounts = [
  { role: "client", name: "Test Client", email: process.env.TEST_CLIENT_EMAIL, path: "/client" },
  { role: "restaurant", name: "Test Restaurant", email: process.env.TEST_RESTAURANT_EMAIL, path: "/restaurant" },
  { role: "courier", name: "Test Livreur", email: process.env.TEST_COURIER_EMAIL, path: "/livreur" },
  { role: "admin", name: "Test Admin", email: process.env.TEST_ADMIN_EMAIL, path: "/admin" },
];
const password = process.env.TEST_ACCOUNT_PASSWORD;
const missing = [
  ...Object.entries(config).filter(([, value]) => !value).map(([key]) => key),
  ...accounts.filter(({ email }) => !email).map(({ role }) => `TEST_${role.toUpperCase()}_EMAIL`),
  ...(password ? [] : ["TEST_ACCOUNT_PASSWORD"]),
];

if (missing.length) {
  throw new Error(`Variables manquantes: ${missing.join(", ")}`);
}

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

for (const account of accounts) {
  let credential;

  try {
    credential = await createUserWithEmailAndPassword(auth, account.email, password);
    console.log(`AUTH CREATED ${account.role}: ${account.email} uid=${credential.user.uid}`);
  } catch (error) {
    if (error?.code !== "auth/email-already-in-use") throw error;
    credential = await signInWithEmailAndPassword(auth, account.email, password);
    console.log(`AUTH EXISTS ${account.role}: ${account.email} uid=${credential.user.uid}`);
  }

  const profileRef = doc(db, "users", credential.user.uid);
  const existingProfile = await getDoc(profileRef);

  if (!existingProfile.exists()) {
    await setDoc(profileRef, {
      id: credential.user.uid,
      email: account.email,
      displayName: account.name,
      role: account.role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`FIRESTORE CREATED ${account.role}: users/${credential.user.uid} role=${account.role}`);
  }

  const snapshot = await getDoc(profileRef);
  const actualRole = snapshot.data()?.role;

  if (actualRole !== account.role) {
    throw new Error(`${account.email}: rôle ${actualRole ?? "absent"}, attendu ${account.role}`);
  }

  console.log(`FIRESTORE OK ${account.role}: users/${credential.user.uid} role=${actualRole}`);
  await signOut(auth);
}

for (const account of accounts) {
  const credential = await signInWithEmailAndPassword(auth, account.email, password);
  const snapshot = await getDoc(doc(db, "users", credential.user.uid));
  const actualRole = snapshot.data()?.role;

  if (actualRole !== account.role) {
    throw new Error(`${account.email}: connexion avec rôle ${actualRole ?? "absent"}, attendu ${account.role}`);
  }

  console.log(`LOGIN OK ${account.role}: ${account.email} role=${actualRole} redirect=${account.path}`);
  await signOut(auth);
}
