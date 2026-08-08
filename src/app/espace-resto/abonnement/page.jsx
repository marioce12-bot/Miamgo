"use client";

import { useState } from "react";
import { Check, Crown } from "lucide-react";
import PlatformShell from "../../../components/PlatformShell";
const plans = [["Basique", "2 500 FCFA", ["Boutique en ligne", "Menu et commandes"]], ["Pro", "5 000 FCFA", ["Promotions", "Livreurs internes", "Statistiques"]], ["Premium IA", "12 000 FCFA", ["Agent IA", "Recommandations", "Tout le plan Pro"]]];
export default function SubscriptionPage() { const [selected, setSelected] = useState("Pro"); return <PlatformShell><main className="content-wrap subscription-page"><p className="eyebrow">ABONNEMENT</p><h1>Votre plan restaurant</h1><section className="subscription-current"><Crown size={25}/><div><strong>Plan {selected} · À activer</strong><p>Aucun paiement n'est prélevé avant votre première publication ou activation.</p></div></section><div className="plan-cards">{plans.map(([name, price, features]) => <button className={selected === name ? "selected" : ""} onClick={() => setSelected(name)} key={name}><h2>{name}</h2><strong>{price}<small>/mois</small></strong>{features.map((feature) => <span key={feature}><Check size={14}/>{feature}</span>)}</button>)}</div><button className="activate-plan">Continuer avec le plan {selected}</button></main></PlatformShell> }
