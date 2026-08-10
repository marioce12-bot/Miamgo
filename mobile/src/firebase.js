import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const config = {
  apiKey: "AIzaSyD02jnMgaMqnONlr3udR9oiYWuaVqbQtVs",
  authDomain: "miamgo-2479d.firebaseapp.com",
  projectId: "miamgo-2479d",
  storageBucket: "miamgo-2479d.firebasestorage.app",
  messagingSenderId: "952584513",
  appId: "1:952584513:web:69d96f4c87b7bd374d79c0",
};

export const app = getApps().length ? getApp() : initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app, "https://miamgo-2479d-default-rtdb.europe-west1.firebasedatabase.app");
