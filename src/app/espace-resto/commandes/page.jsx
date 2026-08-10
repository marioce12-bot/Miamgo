"use client";

import { useEffect, useState } from "react";
import { CalendarClock, ScanLine } from "lucide-react";
import Link from "next/link";
import PlatformShell from "../../../components/PlatformShell";
import DeliveryTrackingMap from "../../../components/DeliveryTrackingMap";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import { getActiveRestaurantDeliveries, getOwnedRestaurant } from "../../../lib/firestore";

const tabs = ["Nouvelles", "En préparation", "Prêtes", "En livraison", "Programmées"];
export default function RestaurantOrders() {
  const [active, setActive] = useState("Nouvelles"); const [orders, setOrders] = useState([]);
  useEffect(() => onAuthStateChanged(auth, async (user) => { if (user) { const restaurant = await getOwnedRestaurant(user.uid).catch(() => null); if (restaurant) setOrders(await getActiveRestaurantDeliveries(restaurant.id).catch(() => [])); } }), []);
  return <PlatformShell><main className="content-wrap restaurant-orders"><div className="restaurant-orders-heading"><div><p className="eyebrow">GESTION DES COMMANDES</p><h1>Commandes</h1><p>Les commandes réelles reçues apparaîtront ici.</p></div><Link href="/espace-resto/scanner"><ScanLine size={18}/>Scanner un retrait</Link></div><div className="restaurant-order-tabs">{tabs.map((tab) => <button type="button" className={active === tab ? "active" : ""} onClick={() => setActive(tab)} key={tab}>{tab}{tab === "Programmées" && <CalendarClock size={14}/>}</button>)}</div>{orders.length ? orders.map((order) => <section className="restaurant-active-order" key={order.id}><div><strong>{order.serialNumber || order.id}</strong><span>{order.deliveryAddress || "Adresse non renseignée"}</span></div><DeliveryTrackingMap orderId={order.id} driverId={order.assignedDriverId} title="Suivi du livreur"/></section>) : <div className="admin-table-placeholder"><CalendarClock size={32}/><h3>Aucune commande {active.toLowerCase()}</h3><p>Les livraisons actives avec un livreur assigné apparaîtront ici.</p></div>}</main></PlatformShell>;
}
