import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { OpeningHours, UserProfile, UserRole } from "@/lib/firestore/models";
import { isUserRole } from "./roles";

function requireFirebase() {
  if (!auth || !db) {
    throw new Error(
      "Firebase n'est pas configuré. Renseignez les variables NEXT_PUBLIC_FIREBASE_*.",
    );
  }

  return { auth, db };
}

export async function registerWithEmail(params: {
  displayName: string;
  email: string;
  password: string;
  role: UserRole;
  restaurant?: {
    address: string;
    phone: string;
    contactEmail: string;
    openingHours: OpeningHours;
  };
}): Promise<UserRole> {
  const services = requireFirebase();
  let credential;
  try {
    credential = await createUserWithEmailAndPassword(
      services.auth,
      params.email.trim(),
      params.password,
    );
  } catch (error) {
    if ((error as { code?: string })?.code !== "auth/email-already-in-use") throw error;
    credential = await signInWithEmailAndPassword(services.auth, params.email.trim(), params.password);
  }

  try {
    const existingProfile = await getDoc(doc(services.db, "users", credential.user.uid));
    if (existingProfile.exists() && existingProfile.data().role !== params.role) {
      throw new Error("Cet e-mail est déjà associé à un autre type de compte.");
    }
    await updateProfile(credential.user, { displayName: params.displayName.trim() });
    const userData = {
      id: credential.user.uid,
      email: credential.user.email,
      displayName: params.displayName.trim(),
      phone: params.restaurant?.phone ?? "",
      role: params.role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (params.role === "restaurant" && params.restaurant) {
      const batch = writeBatch(services.db);
      batch.set(doc(services.db, "users", credential.user.uid), userData);
      batch.set(doc(services.db, "restaurants", credential.user.uid), {
        id: credential.user.uid,
        ownerId: credential.user.uid,
        name: params.displayName.trim(),
        slug: toSlug(params.displayName),
        description: "",
        phone: params.restaurant.phone.trim(),
        contactEmail: params.restaurant.contactEmail.trim(),
        address: params.restaurant.address.trim(),
        openingHours: params.restaurant.openingHours,
        menuCategoryIds: [],
        dailySpecialDishIds: [],
        dailySpecialMode: false,
        subscriptionPlan: "starter",
        deliveryModes: ["pickup"],
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
    } else {
      await setDoc(doc(services.db, "users", credential.user.uid), userData);
    }
  } catch (error) {
    throw new Error(
      `Compte Firebase créé mais profil Firestore non enregistré: ${error instanceof Error ? error.message : "erreur inconnue"}`,
    );
  }

  return params.role;
}

function toSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<UserRole> {
  const services = requireFirebase();
  const credential = await signInWithEmailAndPassword(
    services.auth,
    email.trim(),
    password,
  );
  const snapshot = await getDoc(doc(services.db, "users", credential.user.uid));
  const profile = snapshot.data() as UserProfile | undefined;

  if (!profile || !isUserRole(profile.role)) {
    await signOut(services.auth);
    throw new Error("Aucun profil MiamGo valide n'est associé à ce compte.");
  }

  return profile.role;
}

export async function logout(): Promise<void> {
  const services = requireFirebase();
  await signOut(services.auth);
}
