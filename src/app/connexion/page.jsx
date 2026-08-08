"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, LockKeyhole, Mail, Store, UserRound } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import { getOwnedRestaurant, getUserProfile } from "../../lib/firestore";

export default function LoginPage() {
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const router = useRouter();
  async function login(event) { event.preventDefault(); setLoading(true); setError(""); const form = new FormData(event.currentTarget); let credential; try { credential = await signInWithEmailAndPassword(auth, form.get("email"), form.get("password")); } catch (authError) { const messages = { "auth/invalid-credential": "E-mail ou mot de passe incorrect.", "auth/user-not-found": "Aucun compte ne correspond à cet e-mail.", "auth/wrong-password": "Mot de passe incorrect.", "auth/too-many-requests": "Trop de tentatives. Réessayez dans quelques instants.", "auth/operation-not-allowed": "La connexion E-mail/Mot de passe doit être activée dans Firebase Authentication." }; setError(messages[authError.code] || `Connexion Firebase impossible (${authError.code || "erreur inconnue"}).`); setLoading(false); return; } try { const profile = await getUserProfile(credential.user.uid); if (profile?.role === "restaurant_owner") { router.replace("/espace-resto"); return; } if (profile?.role === "driver") { router.replace("/espace-livreur"); return; } const restaurant = await getOwnedRestaurant(credential.user.uid); router.replace(restaurant ? "/espace-resto" : "/accueil"); } catch (profileError) { router.replace("/accueil?profile=missing"); } finally { setLoading(false); } }
  return <main className="auth-page"><Link className="auth-back" href="/"><ArrowLeft size={17} />Retour à Miamgo</Link><section className="auth-card"><div className="auth-card-brand"><img src="/miamgo-logo.png" alt="Miamgo" /><span>miam<b>go</b></span></div><p className="eyebrow">BON RETOUR PARMI NOUS</p><h1>Connectez-vous à votre espace.</h1><p className="auth-intro">Client, restaurant ou livreur: retrouvez vos commandes et vos outils.</p><form onSubmit={login}><label><Mail size={16} />Adresse e-mail<input name="email" type="email" required placeholder="vous@exemple.com" /></label><label><LockKeyhole size={16} />Mot de passe<input name="password" type="password" required minLength="6" placeholder="Votre mot de passe" /></label>{error && <p className="auth-error">{error}</p>}<button disabled={loading}>{loading ? "Connexion..." : "Se connecter"}</button></form><div className="auth-choices"><p>Pas encore de compte?</p><Link href="/inscription-client"><UserRound size={15} />Je suis client</Link><Link href="/inscription-resto"><Store size={15} />Je suis restaurant</Link></div></section></main>;
}
