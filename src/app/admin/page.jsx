"use client";

import { useEffect, useState } from "react";
import { Activity, Ban, CheckCircle2, ClipboardList, Eye, FileText, LogOut, ShieldCheck, Store, Trash2, Users, Wallet, XCircle } from "lucide-react";

const sections = [
  ["Utilisateurs", Users, "Tous les comptes"],
  ["Restaurants", Store, "Statuts et abonnements"],
  ["Livreurs", Activity, "Validation des dossiers"],
  ["Commandes", ClipboardList, "Historique global"],
  ["Finances", Wallet, "Paiements et statistiques"],
  ["Modération", Ban, "Publications signalées"],
];

const money = (value) => `${Number(value || 0).toLocaleString("fr-FR")} FCFA`;
const date = (value) => value ? new Date(value?.seconds ? value.seconds * 1000 : value).toLocaleDateString("fr-FR") : "Non défini";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [section, setSection] = useState("Utilisateurs");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("month");

  useEffect(() => { if (authenticated) load(period); }, [authenticated, period]);

  async function load(nextPeriod = period) {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/admin/overview?period=${nextPeriod}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Erreur admin.");
      setData(payload);
    } catch (cause) { setError(cause.message); } finally { setLoading(false); }
  }

  async function login(event) {
    event.preventDefault(); setError("");
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (!response.ok) { setError("Mot de passe administrateur invalide."); return; }
    setAuthenticated(true); load();
  }

  async function action(actionName, id, mode, reason = "") {
    const response = await fetch("/api/admin/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: actionName, id, mode, reason }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Action impossible.");
    await load();
  }

  async function driverDecision(id, decision) {
    const reason = decision === "reject" ? window.prompt("Motif du rejet", "Pièce d’identité illisible ou dossier incomplet") || "Dossier rejeté." : "";
    const response = await fetch(`/api/admin/drivers/${id}/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, reason }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Décision impossible.");
    await load();
  }

  async function safeAction(fn) { try { await fn(); } catch (cause) { setError(cause.message); } }

  if (!authenticated) return <main className="admin-login"><section><ShieldCheck size={35}/><p className="eyebrow">ZONE PRIVÉE MIAMGO</p><h1>Administration</h1><p>Console réservée à l’équipe créatrice.</p><form onSubmit={login}><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mot de passe administrateur" required/><button>Accéder</button></form>{error && <small>{error}</small>}</section></main>;

  const count = data?.counts || {};
  const finance = data?.finance || {};
  const list = section === "Utilisateurs" ? data?.users : section === "Restaurants" ? data?.restaurants : section === "Livreurs" ? data?.drivers : section === "Commandes" ? data?.orders : section === "Modération" ? data?.posts : null;
  const paidSubscriptions = (data?.subscriptions || []).filter((item) => ["paid", "active", "completed"].includes(item.status || item.paymentStatus));

  return <main className="admin-page">
    <header className="admin-header"><div><p className="eyebrow">CONSOLE MIAMGO</p><h1>Administration</h1><p>Contrôle opérationnel et financier en temps réel.</p></div><div className="admin-header-actions"><button className="admin-refresh" onClick={load}>{loading ? "Actualisation..." : "Actualiser"}</button><button className="admin-logout" onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); setAuthenticated(false); setData(null); }}><LogOut size={16}/>Sortir</button></div></header>
    {error && <div className="admin-error-box"><XCircle size={17}/>{error}</div>}
    <section className="admin-metrics"><article><Users size={20}/><span>Utilisateurs</span><strong>{count.users || 0}</strong></article><article><Store size={20}/><span>Restaurants</span><strong>{count.restaurants || 0}</strong></article><article><Activity size={20}/><span>Livreurs</span><strong>{count.drivers || 0}</strong></article><article><Wallet size={20}/><span>CA plateforme</span><strong>{money(finance.totalRevenue)}</strong></article></section>
    <div className="admin-layout"><nav className="admin-menu">{sections.map(([label, Icon, description]) => <button className={section === label ? "active" : ""} onClick={() => setSection(label)} key={label}><Icon size={18}/><span><strong>{label}</strong><small>{description}</small></span></button>)}</nav>
      <section className="admin-workspace"><div className="admin-title"><div><p className="eyebrow">{section.toUpperCase()}</p><h2>{section}</h2></div><span className="admin-status"><CheckCircle2 size={14}/>Données Firestore</span></div>
        {section === "Utilisateurs" && <div className="admin-real-list">{(list || []).map((user) => <article key={user.uid}><div><strong>{user.displayName || user.email || user.uid}</strong><small>{user.email} · {user.role || "client"} · Créé le {date(user.createdAt)}</small></div><button className={user.disabled ? "admin-action success" : "admin-action danger"} onClick={() => safeAction(() => action("user-suspension", user.uid, user.disabled ? "restore" : "suspend"))}>{user.disabled ? "Réactiver" : "Suspendre"}</button></article>)}</div>}
        {section === "Restaurants" && <div className="admin-real-list">{(list || []).map((restaurant) => <article key={restaurant.id}><div><strong>{restaurant.name || restaurant.id}</strong><small>Plan {restaurant.plan || "Non défini"} · {restaurant.subscriptionStatus || "inactif"} · Échéance {date(restaurant.subscriptionExpiresAt)}</small></div><button className={restaurant.status === "suspended" ? "admin-action success" : "admin-action danger"} onClick={() => safeAction(() => action("restaurant-status", restaurant.id, restaurant.status === "suspended" ? "restore" : "suspend"))}>{restaurant.status === "suspended" ? "Réactiver" : "Suspendre"}</button></article>)}</div>}
        {section === "Livreurs" && <div className="admin-real-list">{(list || []).map((driver) => <article key={driver.id}><div><strong>{driver.firstName} {driver.lastName}</strong><small>{driver.status || driver.verificationStatus || "pending"} · {driver.phone || "Téléphone non renseigné"}</small>{driver.identityDocumentUrl && <a className="admin-document" href={driver.identityDocumentUrl} target="_blank" rel="noreferrer"><Eye size={14}/>Voir la pièce d’identité</a>}</div><div className="admin-actions">{driver.verificationStatus === "approved" ? <span className="tag success">Validé non abonné</span> : driver.verificationStatus === "rejected" ? <span className="tag danger">Rejeté</span> : <><button className="admin-action success" onClick={() => safeAction(() => driverDecision(driver.id, "approve"))}>Valider</button><button className="admin-action danger" onClick={() => safeAction(() => driverDecision(driver.id, "reject"))}>Rejeter</button></>}</div></article>)}</div>}
        {section === "Commandes" && <div className="admin-real-list">{(list || []).map((order) => <article key={order.id}><div><strong>{order.serialNumber || order.id}</strong><small>{order.status || "pending"} · Paiement {order.paymentStatus || "pending"} · {money(order.total || order.amount)}</small></div><span>{date(order.createdAt)}</span></article>)}</div>}
        {section === "Finances" && <><div className="finance-period"><label>Période<select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="day">Jour</option><option value="month">Mois</option><option value="year">Année</option></select></label></div><div className="finance-grid"><article><Wallet size={20}/><span>Abonnements reçus</span><strong>{money(finance.subscriptionRevenue)}</strong><small>{finance.paidSubscriptions || 0} paiements confirmés</small></article><article><ClipboardList size={20}/><span>Frais de commande</span><strong>{money(finance.orderFees)}</strong><small>{finance.paidOrders || 0} commandes payées</small></article><article><CheckCircle2 size={20}/><span>Total plateforme</span><strong>{money(finance.totalRevenue)}</strong><small>Calculé depuis Firestore</small></article></div><div className="admin-real-list">{paidSubscriptions.map((payment) => <article key={payment.id}><div><strong>{payment.restaurantId || payment.userId || "Paiement"}</strong><small>{payment.plan || payment.type || "Abonnement"} · {money(payment.amount || payment.price)} · {date(payment.createdAt)}</small></div></article>)}</div></>}
        {section === "Modération" && <div className="admin-real-list">{(list || []).filter((post) => post.moderationStatus !== "removed").map((post) => <article key={post.id}><div><strong>{post.restaurantName || post.restaurantId || "Publication"}</strong><small>{post.text || post.dish || "Sans texte"} · {date(post.createdAt)}</small>{post.mediaUrl && <a className="admin-document" href={post.mediaUrl} target="_blank" rel="noreferrer"><FileText size={14}/>Voir le média</a>}</div><button className="admin-action danger" onClick={() => safeAction(() => action("remove-post", post.id, "remove", "Contenu retiré par la modération."))}><Trash2 size={14}/>Retirer</button></article>)}</div>}
        {!list && section !== "Finances" && <div className="admin-table-placeholder"><ClipboardList size={30}/><h3>Aucune donnée</h3><p>Les données réelles apparaîtront ici dès leur création.</p></div>}
      </section>
    </div>
  </main>;
}
