"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, LockKeyhole, Mail, Store, UserRound } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import { getUserProfile } from "../../lib/firestore";

export default function LoginPage() {
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const router = useRouter();
  async function login(event) { event.preventDefault(); setLoading(true); setError(""); const form = new FormData(event.currentTarget); try { const credential = await signInWithEmailAndPassword(auth, form.get("email"), form.get("password")); const profile = await getUserProfile(credential.user.uid); router.push(profile?.role === "restaurant_owner" ? "/espace-resto" : profile?.role === "driver" ? "/espace-livreur" : "/accueil"); } catch { setError("Connexion impossible. Vérifiez votre adresse e-mail et votre mot de passe."); } finally { setLoading(false); } }
  return <main className="auth-page"><Link className="auth-back" href="/"><ArrowLeft size={17} />Retour à Miamgo</Link><section className="auth-card"><div className="auth-card-brand"><img src="/miamgo-logo.png" alt="Miamgo" /><span>miam<b>go</b></span></div><p className="eyebrow">BON RETOUR PARMI NOUS</p><h1>Connectez-vous à votre espace.</h1><p className="auth-intro">Client, restaurant ou livreur: retrouvez vos commandes et vos outils.</p><form onSubmit={login}><label><Mail size={16} />Adresse e-mail<input name="email" type="email" required placeholder="vous@exemple.com" /></label><label><LockKeyhole size={16} />Mot de passe<input name="password" type="password" required minLength="6" placeholder="Votre mot de passe" /></label>{error && <p className="auth-error">{error}</p>}<button disabled={loading}>{loading ? "Connexion..." : "Se connecter"}</button></form><div className="auth-choices"><p>Pas encore de compte?</p><Link href="/inscription-client"><UserRound size={15} />Je suis client</Link><Link href="/inscription-resto"><Store size={15} />Je suis restaurant</Link></div></section></main>;
}
