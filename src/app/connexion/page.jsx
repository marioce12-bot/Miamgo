"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bike, LockKeyhole, Mail, Store, UserRound } from "lucide-react";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import { getOwnedRestaurant, getUserProfile } from "../../lib/firestore";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function redirect(user) {
    const idToken = await user.getIdToken();
    const response = await fetch("/api/auth/session", { method: "POST", headers: { Authorization: `Bearer ${idToken}` } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Session serveur indisponible.");
    const profile = await getUserProfile(user.uid);
    if (profile?.role === "restaurant_owner") return router.replace("/espace-resto");
    if (profile?.role === "driver") return router.replace("/espace-livreur");
    router.replace(await getOwnedRestaurant(user.uid) ? "/espace-resto" : "/accueil");
  }

  async function login(event) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    try { await redirect((await signInWithEmailAndPassword(auth, form.get("email"), form.get("password"))).user); }
    catch (cause) { setError(cause.code === "auth/user-disabled" || cause.message?.includes("suspendu") ? "Ce compte est suspendu. Contactez l’administration pour demander sa réactivation." : cause.message || "E-mail ou mot de passe incorrect."); }
    finally { setLoading(false); }
  }

  async function googleLogin() {
    setLoading(true); setError("");
    try { await redirect((await signInWithPopup(auth, new GoogleAuthProvider())).user); }
    catch (cause) { if (!["auth/popup-closed-by-user", "auth/cancelled-popup-request"].includes(cause.code)) setError(cause.message || "La connexion Google est momentanément indisponible."); }
    finally { setLoading(false); }
  }

  return <main className="auth-page"><Link className="auth-back" href="/"><ArrowLeft size={17}/>Retour à Miamgo</Link><section className="auth-card"><div className="auth-card-brand"><img src="/miamgo-logo.png" alt="Miamgo"/></div><p className="eyebrow">BON RETOUR PARMI NOUS</p><h1>Connectez-vous à votre espace.</h1><p className="auth-intro">Retrouvez vos commandes, votre boutique ou vos courses depuis le bon espace.</p><form onSubmit={login}><label><Mail size={15}/>Adresse e-mail<input name="email" type="email" required placeholder="vous@exemple.com"/></label><label><LockKeyhole size={15}/>Mot de passe<input name="password" type="password" required placeholder="Votre mot de passe"/></label><button disabled={loading}>{loading ? "Connexion..." : "Se connecter"}</button></form><button className="google-login" type="button" onClick={googleLogin}><b>G</b>Continuer avec Google</button>{error && <p className="auth-error">{error}</p>}<div className="auth-choices"><Link href="/inscription-client"><UserRound size={16}/>Créer un compte client</Link><Link href="/inscription-resto"><Store size={16}/>Espace restaurant</Link><Link href="/inscription-livreur"><Bike size={16}/>Devenir livreur</Link></div></section></main>;
}
