"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, Users } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import PlatformShell from "../../../components/PlatformShell";
import { auth } from "../../../lib/firebase";

export default function RestaurantOrders() {
  const [clients, setClients] = useState([]); const [search, setSearch] = useState(""); const [loading, setLoading] = useState(true); const [message, setMessage] = useState("");
  useEffect(() => { let timer; const stop = onAuthStateChanged(auth, async (user) => { if (!user) { setLoading(false); return; } const load = async () => { try { const token = await user.getIdToken(); const response = await fetch("/api/orders/restaurant-clients", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error); setClients(payload.clients || []); } catch (error) { setMessage(error.message); } finally { setLoading(false); } }; await load(); timer = window.setInterval(load, 10000); }); return () => { stop(); window.clearInterval(timer); }; }, []);
  const visible = clients.filter((client) => `${client.displayName} ${client.city}`.toLowerCase().includes(search.toLowerCase()));
  return <PlatformShell><main className="content-wrap restaurant-orders"><div className="restaurant-orders-heading"><div><p className="eyebrow">RELATION CLIENTS</p><h1>Vos clients</h1><p>Retrouvez les commandes regroupées par client.</p></div><Users size={28}/></div><label className="client-orders-search"><Search size={17}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un client" /></label>{message && <p className="settings-notice">{message}</p>}{loading ? <p>Chargement des clients...</p> : visible.length ? <section className="restaurant-client-list">{visible.map((client) => <Link className="restaurant-client-card" href={`/espace-resto/commandes/${client.id}`} key={client.id}><span className="restaurant-client-avatar">{client.photoURL ? <img src={client.photoURL} alt="" /> : (client.displayName || "C").slice(0, 2).toUpperCase()}</span><span className="restaurant-client-info"><strong>{client.displayName}</strong><small>{client.city || "Client Miamgo"}</small><b>{client.ordersCount} commande{client.ordersCount > 1 ? "s" : ""} · {client.activeCount} en cours</b></span><ArrowRight size={17}/></Link>)}</section> : <section className="empty-state"><Users size={32}/><h2>Aucun client</h2><p>Les clients ayant commandé dans votre établissement apparaîtront ici.</p></section>}</main></PlatformShell>;
}
