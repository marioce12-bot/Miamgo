"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bike, ChevronLeft, CheckCircle2 } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import PlatformShell from "../../components/PlatformShell";
import { auth } from "../../lib/firebase";
import { createDriverApplication, ensureCustomerProfile } from "../../lib/firestore";

export default function DriverApplication() {
  const [user, setUser] = useState(null); const [status, setStatus] = useState("");
  useEffect(() => onAuthStateChanged(auth, (session) => { setUser(session); if (session) ensureCustomerProfile(session).catch(console.error); }), []);
  async function apply(event) { event.preventDefault(); if (!user) { setStatus("Connectez-vous depuis le fil pour envoyer votre candidature."); return; } const data = new FormData(event.currentTarget); try { await createDriverApplication(user.uid, { firstName: data.get("firstName"), lastName: data.get("lastName"), phone: data.get("phone"), city: data.get("city"), gender: data.get("gender") }); setStatus("Candidature envoyée. Un restaurant ou Miamgo vous contactera après vérification."); } catch { setStatus("Impossible d'envoyer la candidature. Vérifiez Firestore."); } }
  return <PlatformShell><main className="onboarding-page driver-application"><Link className="back-link" href="/"><ChevronLeft size={17} />Retour à Miamgo</Link><div className="onboarding-title"><p className="eyebrow">DEVENIR LIVREUR</p><h1>Livrez les repas de votre ville.</h1><p>Inscrivez-vous au réseau Miamgo ou auprès d&apos;un restaurant partenaire.</p></div><form className="onboarding-form" onSubmit={apply}><section><Bike size={28} className="application-icon" /><h2>Vos informations</h2><label>Prénom<input name="firstName" required placeholder="Votre prénom" /></label><label>Nom<input name="lastName" required placeholder="Votre nom" /></label><label>Numéro WhatsApp<input name="phone" required placeholder="+229 00 00 00 00" /></label><label>Ville<select name="city" defaultValue="Cotonou"><option>Cotonou</option><option>Porto-Novo</option><option>Abidjan</option><option>Lomé</option></select></label><label>Genre<select name="gender" defaultValue=""><option value="" disabled>Choisir</option><option>Femme</option><option>Homme</option><option>Préfère ne pas préciser</option></select></label></section><button className="create-restaurant" type="submit">Envoyer ma candidature</button>{status && <p className="onboarding-status"><CheckCircle2 size={15} />{status}</p>}</form></main></PlatformShell>;
}
