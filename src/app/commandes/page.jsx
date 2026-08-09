"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import PlatformShell from "../../components/PlatformShell";

export default function OrdersPage() {
  return <PlatformShell active="Commandes"><main className="content-wrap orders-page"><p className="eyebrow">VOS REPAS</p><h1>Mes commandes</h1><section className="empty-state"><ClipboardList size={34}/><h2>Aucune commande</h2><p>Vos commandes réelles apparaîtront ici après un paiement confirmé.</p><Link href="/explorer">Explorer les restaurants</Link></section></main></PlatformShell>;
}
