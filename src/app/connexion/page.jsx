"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bike, LockKeyhole, Mail, Store, UserRound } from "lucide-react";
import { GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import { getOwnedRestaurant, getUserProfile } from "../../lib/firestore";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
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

  async function resetPassword(event) {
    event.preventDefault(); setLoading(true); setError(""); setResetSent(false);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSent(true);
    } catch (cause) {
      setError(cause.code === "auth/user-not-found" ? "Aucun compte ne correspond à cette adresse e-mail." : cause.code === "auth/invalid-email" ? "Adresse e-mail invalide." : "Impossible d’envoyer l’e-mail de récupération.");
    } finally { setLoading(false); }
  }

  return <main className="auth-page"><Link className="auth-back" href="/"><ArrowLeft size={17}/>Retour à Miamgo</Link><section className="auth-card"><div className="auth-card-brand"><img src="/miamgo-logo.png" alt="Miamgo"/></div><p className="eyebrow">BON RETOUR PARMI NOUS</p><h1>Connectez-vous à votre espace.</h1><p className="auth-intro">Retrouvez vos commandes, votre boutique ou vos courses depuis le bon espace.</p>{forgotMode ? <form onSubmit={resetPassword} className="password-reset-form"><label><Mail size={15}/>Adresse e-mail<input value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} type="email" required placeholder="vous@exemple.com"/></label><button disabled={loading}>{loading ? "Envoi..." : "Recevoir le lien"}</button><button className="auth-link-button" type="button" onClick={() => { setForgotMode(false); setResetSent(false); setError(""); }}>Retour à la connexion</button>{resetSent && <p className="auth-success">E-mail envoyé. Consultez votre boîte de réception et vos spams.</p>}</form> : <><form onSubmit={login}><label><Mail size={15}/>Adresse e-mail<input name="email" type="email" required placeholder="vous@exemple.com"/></label><label><LockKeyhole size={15}/>Mot de passe<input name="password" type="password" required placeholder="Votre mot de passe"/></label><button disabled={loading}>{loading ? "Connexion..." : "Se connecter"}</button></form><button className="forgot-password" type="button" onClick={() => { setForgotMode(true); setResetEmail(""); setError(""); }}>Mot de passe oublié ?</button><button className="google-login" type="button" onClick={googleLogin}><b>G</b>Continuer avec Google</button></>}{error && <p className="auth-error">{error}</p>}{!forgotMode && <div className="auth-choices"><Link href="/inscription-client"><UserRound size={16}/>Créer un compte client</Link><Link href="/inscription-resto"><Store size={16}/>Espace restaurant</Link><Link href="/inscription-livreur"><Bike size={16}/>Devenir livreur</Link></div>}</section></main>;
}
