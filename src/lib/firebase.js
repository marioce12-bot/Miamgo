import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD02jnMgaMqnONlr3udR9oiYWuaVqbQtVs",
  authDomain: "miamgo-2479d.firebaseapp.com",
  projectId: "miamgo-2479d",
  storageBucket: "miamgo-2479d.firebasestorage.app",
  messagingSenderId: "952584513",
  appId: "1:952584513:web:69d96f4c87b7bd374d79c0",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const firebaseConfigured = true;
