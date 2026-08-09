"use client";

import Link from "next/link";
import { PenLine, Store } from "lucide-react";
import PlatformShell from "../../../components/PlatformShell";

export default function RestaurantProfile() {
  return <PlatformShell><main className="restaurant-profile-page"><section className="restaurant-public-profile"><div className="restaurant-profile-cover"/><div className="restaurant-profile-body"><div className="restaurant-profile-avatar"><Store size={22}/></div><div className="restaurant-profile-title"><p className="eyebrow">PROFIL RESTAURANT</p><h1>Votre restaurant</h1><p>Les informations de votre établissement apparaîtront ici après sa création.</p></div></div></section><section className="restaurant-post-history"><div className="section-heading"><div><p className="eyebrow">VOTRE FIL</p><h2>Publications</h2></div><Link href="/espace-resto/publier"><PenLine size={16}/>Nouvelle publication</Link></div><div className="admin-table-placeholder"><p>Aucune publication réelle pour le moment.</p></div></section></main></PlatformShell>;
}
