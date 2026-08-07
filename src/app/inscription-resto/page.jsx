"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, Store, Truck } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import PlatformShell from "../../components/PlatformShell";
import { auth } from "../../lib/firebase";
import { createRestaurant, ensureCustomerProfile } from "../../lib/firestore";

const plans = [
  ["basic", "Basique", "2 500 FCFA", ["Boutique en ligne", "Menu et plats du jour", "Commandes et retrait QR"]],
  ["pro", "Pro", "5 000 FCFA", ["Tout le plan Basique", "Promotions et statistiques", "Équipe et livreurs internes"]],
  ["premium", "Premium IA", "12 000 FCFA", ["Tout le plan Pro", "Agent IA restaurant", "Recommandations clients"]],
];

export default function RestaurantOnboarding() {
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState("pro");
  const [delivery, setDelivery] = useState("internal");
  const [status, setStatus] = useState("");

  useEffect(() => onAuthStateChanged(auth, (session) => {
    setUser(session);
    if (session) ensureCustomerProfile(session).catch(console.error);
  }), []);

  async function submitRestaurant(event) {
    event.preventDefault();
    if (!user) return;
    const form = new FormData(event.currentTarget);
    const name = form.get("name").trim();
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setStatus("Création de votre boutique...");
    try {
      await createRestaurant(user.uid, { slug, name, category: form.get("category"), phone: form.get("phone"), address: form.get("address"), plan, deliveryMode: delivery });
      setStatus("Votre demande a été enregistrée. L'équipe Miamgo validera votre boutique avant publication.");
    } catch {
      setStatus("Impossible de créer la boutique. Vérifiez que Firestore est activé et réessayez.");
    }
  }

  return <PlatformShell><main className="onboarding-page"><Link className="back-link" href="/"><ChevronLeft size={17} />Retour au fil</Link><div className="onboarding-title"><p className="eyebrow">DEVENEZ PARTENAIRE MIAMGO</p><h1>Créez votre boutique en quelques minutes.</h1><p>Vendez vos plats du jour, recevez vos commandes et pilotez votre activité depuis un seul espace.</p></div>{!user ? <section className="auth-gate"><Store size={31} /><h2>Connectez-vous avant de créer votre restaurant</h2><p>Votre compte permet de sécuriser la propriété de votre boutique.</p><Link href="/">Se connecter depuis le fil</Link></section> : <form className="onboarding-form" onSubmit={submitRestaurant}><section><h2>Votre établissement</h2><label>Nom du restaurant<input name="name" required placeholder="Ex. Chez Aïcha" /></label><label>Type de cuisine<select name="category" defaultValue=""><option value="" disabled>Sélectionnez une catégorie</option><option>Cuisine béninoise</option><option>Grillades</option><option>Pâtes et pizzas</option><option>Pâtisserie</option></select></label><label>Numéro WhatsApp<input name="phone" required type="tel" placeholder="+229 00 00 00 00" /></label><label>Adresse<input name="address" required placeholder="Quartier, rue, ville" /></label></section><section><h2>Votre formule</h2><div className="plan-options">{plans.map(([id, title, price, features]) => <button type="button" className={plan === id ? "selected" : ""} onClick={() => setPlan(id)} key={id}><div><strong>{title}</strong><b>{price}<small>/mois</small></b></div><ul>{features.map((feature) => <li key={feature}><Check size={14} />{feature}</li>)}</ul></button>)}</div></section><section><h2>Livraison</h2><div className="delivery-options onboarding-delivery"><button type="button" className={delivery === "internal" ? "selected" : ""} onClick={() => setDelivery("internal")}><Truck size={22} /><div><strong>J&apos;ai mes propres livreurs</strong><span>Vous les ajouterez après création de la boutique.</span></div>{delivery === "internal" && <Check size={17} />}</button><button type="button" className={delivery === "partner" ? "selected" : ""} onClick={() => setDelivery("partner")}><Store size={22} /><div><strong>Utiliser le réseau Miamgo</strong><span>Accédez aux livreurs et agences partenaires.</span></div>{delivery === "partner" && <Check size={17} />}</button><button type="button" className={delivery === "none" ? "selected" : ""} onClick={() => setDelivery("none")}><Store size={22} /><div><strong>Retrait sur place uniquement</strong><span>La livraison pourra être activée plus tard.</span></div>{delivery === "none" && <Check size={17} />}</button></div></section><button className="create-restaurant" type="submit">Créer ma boutique</button>{status && <p className="onboarding-status">{status}</p>}</form>}</main></PlatformShell>;
}
