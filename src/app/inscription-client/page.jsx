"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, UserRound } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import { registerProfile } from "../../lib/firestore";

export default function CustomerSignup() {
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const router = useRouter();
  async function signup(event) { event.preventDefault(); setLoading(true); setError(""); const form = new FormData(event.currentTarget); try { const credential = await createUserWithEmailAndPassword(auth, form.get("email"), form.get("password")); await registerProfile(credential.user, { displayName: form.get("name"), phone: form.get("phone"), role: "client" }); router.push("/accueil"); } catch { setError("Impossible de créer le compte. Cette adresse e-mail est peut-être déjà utilisée."); } finally { setLoading(false); } }
  return <main className="auth-page"><Link className="auth-back" href="/"><ArrowLeft size={17} />Retour à Miamgo</Link><section className="auth-card"><div className="auth-card-brand"><img src="/miamgo-logo.png" alt="Miamgo" /><span>miam<b>go</b></span></div><p className="eyebrow">COMPTE CLIENT</p><h1>Vos bons repas commencent ici.</h1><p className="auth-intro">Créez votre compte pour commander, enregistrer vos restaurants et suivre vos livraisons.</p><form onSubmit={signup}><label><UserRound size={16} />Nom complet<input name="name" required placeholder="Votre nom" /></label><label>Numéro WhatsApp<input name="phone" required placeholder="+229 00 00 00 00" /></label><label>Adresse e-mail<input name="email" type="email" required placeholder="vous@exemple.com" /></label><label>Mot de passe<input name="password" type="password" required minLength="6" placeholder="6 caractères minimum" /></label>{error && <p className="auth-error">{error}</p>}<button disabled={loading}>{loading ? "Création..." : "Créer mon compte client"}</button></form><p className="auth-foot"><CheckCircle2 size={15} />Déjà inscrit? <Link href="/connexion">Se connecter</Link></p></section></main>;
}
