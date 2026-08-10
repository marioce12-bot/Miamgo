"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import PlatformShell from "../../components/PlatformShell";
import DeliveryTrackingMap from "../../components/DeliveryTrackingMap";
import { auth } from "../../lib/firebase";
import { getActiveCustomerDelivery } from "../../lib/firestore";

export default function OrdersPage() {
  const [order, setOrder] = useState(null);
  useEffect(() => onAuthStateChanged(auth, async (user) => { if (user) setOrder(await getActiveCustomerDelivery(user.uid).catch(() => null)); }), []);
  return <PlatformShell active="Commandes"><main className="content-wrap orders-page"><p className="eyebrow">VOS REPAS</p><h1>Mes commandes</h1>{order ? <><section className="active-order-card"><strong>{order.serialNumber || "Commande en cours"}</strong><span>{order.restaurantName || order.restaurantId || "Restaurant"} · Livraison en cours</span></section><DeliveryTrackingMap orderId={order.id} driverId={order.assignedDriverId} title="Votre livreur en route"/></> : <section className="empty-state"><ClipboardList size={34}/><h2>Aucune commande en cours</h2><p>Vos commandes avec livraison apparaîtront ici pendant le trajet.</p><Link href="/explorer">Explorer les restaurants</Link></section>}</main></PlatformShell>;
}
