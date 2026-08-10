import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase";
import { getUserProfile } from "../firestore";

export async function authenticateForSignup(email, password, role) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  let credential;
  let existing = false;

  try {
    credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
  } catch (error) {
    if (error?.code !== "auth/email-already-in-use") throw error;
    credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    existing = true;
  }

  const profile = await getUserProfile(credential.user.uid);
  if (profile?.role && profile.role !== role) {
    const error = new Error("role-already-used");
    error.code = "role-already-used";
    throw error;
  }

  return { user: credential.user, profile, existing };
}

export async function createServerSession(user) {
  const token = await user.getIdToken(true);
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Session serveur indisponible.");
  return payload;
}

export function signupDestination(role) {
  if (role === "restaurant_owner") return "/espace-resto";
  if (role === "driver") return "/espace-livreur";
  return "/accueil";
}

export function explainAuthError(error) {
  const messages = {
    "auth/email-already-in-use": "Cette adresse e-mail possède déjà un compte.",
    "auth/invalid-email": "L’adresse e-mail est invalide.",
    "auth/weak-password": "Le mot de passe doit contenir au moins 6 caractères.",
    "auth/invalid-credential": "Adresse e-mail ou mot de passe incorrect.",
    "auth/wrong-password": "Adresse e-mail ou mot de passe incorrect.",
    "auth/user-disabled": "Ce compte est suspendu. Contactez l’administration.",
    "auth/network-request-failed": "Connexion impossible. Vérifiez votre connexion Internet.",
    "role-already-used": "Cette adresse e-mail est déjà utilisée pour un autre type de compte.",
  };
  return messages[error?.code] || error?.message || "Impossible de créer le compte. Vérifiez les informations saisies.";
}
