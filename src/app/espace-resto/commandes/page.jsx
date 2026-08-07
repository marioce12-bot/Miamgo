"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, ChevronRight, QrCode, ScanLine } from "lucide-react";
import PlatformShell from "../../../components/PlatformShell";

const groups = {
  Nouvelles: [["#MG-0847", "Marie Adjoua", "Riz gras + bissap", "Maintenant", "À accepter"], ["#MG-0846", "Paul K.", "Poulet braisé", "Il y a 4 min", "À accepter"]],
  "En préparation": [["#MG-0842", "Sarah D.", "Riz au gras", "12:45", "Préparation"]],
  Prêtes: [["#MG-0841", "Jean K.", "2 plats · Retrait", "12:38", "Retrait QR"]],
  "En livraison": [["#MG-0840", "Awa M.", "Poisson braisé", "12:21", "Livreur en route"]],
  Programmées: [["#MG-0850", "Inès T.", "Spaghetti bolognaise", "Aujourd'hui · 18:00", "À préparer à 17:35"], ["#MG-0851", "Moussa B.", "Riz gras", "Demain · 10:00", "À préparer à 09:30"]],
};

export default function RestaurantOrders() {
  const [tab, setTab] = useState("Nouvelles");
  return <PlatformShell><main className="content-wrap restaurant-orders"><div className="restaurant-orders-heading"><div><p className="eyebrow">GESTION DES COMMANDES</p><h1>Commandes</h1><p>Suivez les commandes en temps réel et préparez celles qui sont programmées.</p></div><Link href="/espace-resto/scanner"><ScanLine size={18} />Scanner un retrait</Link></div><nav className="restaurant-order-tabs">{Object.keys(groups).map((name) => <button className={tab === name ? "active" : ""} onClick={() => setTab(name)} key={name}>{name}{name === "Nouvelles" && <b>2</b>}{name === "Programmées" && <CalendarClock size={14} />}</button>)}</nav><section className="restaurant-order-list">{groups[tab].map(([number, customer, meal, time, status]) => <article key={number}><div className="order-number"><strong>{number}</strong><small>{meal}</small></div><div><strong>{customer}</strong><small>{time}</small></div><b>{status}</b>{tab === "Prêtes" && <Link href="/espace-resto/scanner"><QrCode size={17} />Scanner</Link>}<button><ChevronRight size={18} /></button></article>)}</section><section className="scheduled-info"><CalendarClock size={21} /><div><strong>Commandes programmées</strong><p>Une commande programmée reste dans cet onglet jusqu&apos;au moment de commencer sa préparation. Le restaurant reçoit une alerte avant l&apos;heure requise.</p></div></section></main></PlatformShell>;
}
