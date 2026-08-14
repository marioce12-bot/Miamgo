"use client";

import Link from "next/link";
import { BarChart3, Bell, ClipboardList, Home, LayoutDashboard, MapPin, PackageCheck, Plus, Store, Truck, UserRound, Wallet } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { addRestaurantReview, getDriverApplication, getOwnedRestaurant, getRecentDeliveredOrders, getRestaurantBySlug, getRestaurantReviews, getUserProfile } from "../lib/firestore";

function ReviewPrompt({ role, roleReady, pathname }) {
  const [prompt, setPrompt] = useState(null);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!roleReady || role !== "client" || !auth.currentUser) return undefined;
    let cancelled = false;
    let timer;
    async function findPrompt() {
      const orders = await getRecentDeliveredOrders(auth.currentUser.uid).catch(() => []);
      for (const order of orders) {
        const deliveredAt = order.fulfilledAt?.toMillis?.() || new Date(order.fulfilledAt || 0).getTime();
        const wait = 10 * 60 * 1000 - (Date.now() - deliveredAt);
        const restaurantId = order.restaurantId;
        const dismissedKey = `miamgo-review-prompt:${auth.currentUser.uid}:${restaurantId}`;
        if (!restaurantId || localStorage.getItem(dismissedKey)) continue;
        const restaurant = await getRestaurantBySlug(restaurantId).catch(() => null);
        if (!restaurant) continue;
        const reviews = await getRestaurantReviews(restaurant.id).catch(() => []);
        if (reviews.some((review) => review.userId === auth.currentUser.uid)) { localStorage.setItem(dismissedKey, "reviewed"); continue; }
        if (wait > 0) { timer = window.setTimeout(findPrompt, wait); return; }
        if (!cancelled) setPrompt({ order, restaurant, dismissedKey });
        return;
      }
    }
    findPrompt();
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [pathname, role, roleReady]);

  function dismiss() { if (prompt) localStorage.setItem(prompt.dismissedKey, "dismissed"); setPrompt(null); }
  async function submit(event) {
    event.preventDefault();
    if (!prompt || !rating) { setError("Choisissez une note avant de continuer."); return; }
    setSaving(true); setError("");
    try { await addRestaurantReview(prompt.restaurant.id, auth.currentUser.uid, { rating, text: text.trim() }); localStorage.setItem(prompt.dismissedKey, "reviewed"); setPrompt(null); } catch (cause) { setError(cause.message || "Impossible d'enregistrer votre avis."); } finally { setSaving(false); }
  }

  if (!prompt) return null;
  return <div className="review-prompt-backdrop"><section className="review-prompt" role="dialog" aria-modal="true" aria-labelledby="review-prompt-title"><button type="button" className="review-prompt-close" onClick={dismiss} aria-label="Fermer">×</button><div className="review-prompt-restaurant">{prompt.restaurant.photoURL || prompt.restaurant.coverURL ? <img src={prompt.restaurant.photoURL || prompt.restaurant.coverURL} alt="" /> : <span>{(prompt.restaurant.name || "R").slice(0, 2).toUpperCase()}</span>}<div><strong>{prompt.restaurant.name || "Restaurant Miamgo"}</strong><small>Commande livrée</small></div></div><p className="eyebrow">VOTRE AVIS COMPTE</p><h2 id="review-prompt-title">Comment s&apos;est passée votre expérience ?</h2><p className="review-prompt-text">Votre commande est arrivée. Laissez une note et un petit mot pour aider ce restaurant.</p><form onSubmit={submit}><div className="review-prompt-stars">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} onClick={() => setRating(value)} aria-label={`${value} étoiles`}><span className={value <= rating ? "selected" : ""}>★</span></button>)}</div><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Votre avis (facultatif)" />{error && <p className="review-prompt-error">{error}</p>}<button className="review-prompt-submit" type="submit" disabled={saving}>{saving ? "Enregistrement..." : "Publier mon avis"}</button></form><button type="button" className="review-prompt-later" onClick={dismiss}>Plus tard</button></section></div>;
}

export default function PlatformShell({ children, active = "", publicPage = false }) {
  const pathname = usePathname();
  const router = useRouter();
  const [location, setLocation] = useState({ city: "Cotonou", country: "BJ" });
  const [profileLink, setProfileLink] = useState("/profil");
  const [role, setRole] = useState(null);
  const [roleReady, setRoleReady] = useState(false);
  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) { setRole("client"); setRoleReady(true); return; }
    const profile = await getUserProfile(user.uid).catch(() => null);
    if (profile?.city) setLocation({ city: profile.city, country: profile.country || "BJ" });
    if (profile?.role === "restaurant_owner") setProfileLink("/espace-resto");
    if (profile?.role === "driver") setProfileLink("/espace-livreur");
    const driverApplication = profile?.role === "client" ? await getDriverApplication(user.uid).catch(() => null) : null;
    if (driverApplication) { setProfileLink("/espace-livreur"); setRole("driver"); }
    else if (profile?.role) setRole(profile.role);
    if (profile?.role !== "restaurant_owner" && await getOwnedRestaurant(user.uid).catch(() => null)) { setProfileLink("/espace-resto"); setRole("restaurant_owner"); }
    setRoleReady(true);
  }), []);
  const isRestaurant = role === "restaurant_owner";
  const isDriver = role === "driver";
  const isPublicAuth = pathname === "/connexion" || pathname.startsWith("/inscription-");
  const authType = pathname.includes("inscription-resto") ? "restaurant-auth" : pathname.includes("inscription-livreur") ? "driver-auth" : pathname.includes("inscription-client") ? "client-auth" : "";
  const currentItem = (href) => href === "/accueil" ? pathname === "/accueil" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className={`platform-page ${isRestaurant ? "restaurant-shell" : ""} ${isPublicAuth ? "public-auth-page" : ""} ${authType}`}>
      <header className="portal-header">
        {pathname !== "/" && pathname !== "/accueil" && <button className={`desktop-back ${pathname.startsWith("/restaurant/") ? "restaurant-back" : ""}`} onClick={() => router.replace(isRestaurant ? "/espace-resto" : "/accueil")}>← Retour</button>}
        <Link className="brand brand-with-logo" href="/accueil"><img src="/miamgo-logo.png" alt="Logo Miamgo" /></Link>
        <div className="portal-location"><MapPin size={16} /><span>{location.city}, {location.country}</span></div>
        <div className="portal-actions"><Link className="notification-link" href={profileLink} aria-label="Notifications"><Bell size={19} /><b>2</b></Link><Link href={profileLink}>Mon profil</Link></div>
      </header>
      {isRestaurant && !publicPage && !isPublicAuth && <aside className="restaurant-desktop-nav"><p className="eyebrow">ESPACE RESTAURANT</p>{[["Commandes", "/espace-resto/commandes", PackageCheck], ["Menu", "/espace-resto/menu", Store], ["Livraison", "/espace-resto/livraison", Truck], ["Fil Miamgo", "/accueil", Home], ["Publications", "/espace-resto/publier", ClipboardList], ["Statistiques", "/espace-resto/statistiques", LayoutDashboard], ["Profil boutique", "/espace-resto/profil", UserRound], ["Abonnement", "/espace-resto/abonnement", Bell]].map(([label, href, Icon]) => <Link className={currentItem(href) ? "active" : ""} href={href} key={label}><Icon size={17}/>{label}</Link>)}</aside>}
      {isDriver && !isPublicAuth && <aside className="driver-desktop-nav"><p className="eyebrow">ESPACE LIVREUR</p>{[["Tableau de bord", "/espace-livreur", LayoutDashboard], ["Historique", "/espace-livreur/historique", ClipboardList], ["Chiffre d'affaires", "/espace-livreur/chiffre-affaires", BarChart3], ["Restaurants affiliés", "/espace-livreur/affiliations", Store], ["Abonnement", "/espace-livreur/paiement", Wallet], ["Profil / Paramètres", "/espace-livreur/profil", UserRound]].map(([label, href, Icon]) => <Link className={currentItem(href) ? "active" : ""} href={href} key={label}><Icon size={17}/>{label}</Link>)}<button className="driver-sidebar-logout">Déconnexion</button></aside>}
      <div className={roleReady ? "role-content" : "role-content role-content-loading"}>{children}</div>
      <ReviewPrompt role={role} roleReady={roleReady} pathname={pathname} />
      {isRestaurant && (pathname === "/espace-resto/commandes" || pathname === "/espace-resto/menu") && <Link className="restaurant-fab" href={pathname === "/espace-resto/menu" ? "/espace-resto/menu?create=1" : "/espace-resto/publier"}><Plus size={23} /></Link>}
    </div>
  );
}
