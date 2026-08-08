"use client";

import Link from "next/link";
import { BarChart3, CreditCard, LogOut, Megaphone, Settings, Store, Wallet } from "lucide-react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import PlatformShell from "../../../components/PlatformShell";
import { auth } from "../../../lib/firebase";

export default function RestaurantMore() {
  const router = useRouter();
  const links = [["Statistiques", "Chiffre d'affaires, panier moyen, meilleurs plats", BarChart3, "/espace-resto/statistiques"], ["Publications", "Historique et portée de vos publicités", Megaphone, "/espace-resto/publier"], ["Profil boutique", "Bannière, horaires, avis et WhatsApp", Store, "/espace-resto/profil"], ["Abonnement", "Plan actuel et changement de formule", CreditCard, "/espace-resto/abonnement"], ["Paramètres", "Informations du compte, mot de passe et employés", Settings, "/espace-resto/parametres"]];
  return <PlatformShell><main className="content-wrap restaurant-more-page"><p className="eyebrow">ESPACE RESTAURANT</p><h1>Plus</h1><div>{links.map(([title,text,Icon,href]) => <Link href={href} key={title}><Icon size={21}/><span><strong>{title}</strong><small>{text}</small></span></Link>)}</div><section className="restaurant-stat-mini"><Wallet size={23}/><div><strong>48 500 FCFA</strong><span>Chiffre d&apos;affaires aujourd&apos;hui</span></div></section><button className="restaurant-more-logout" onClick={async () => { await signOut(auth); router.push("/"); }}><LogOut size={18} />Déconnexion</button></main></PlatformShell>;
}
