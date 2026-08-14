"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock3, Heart, MapPin, Plus, Share2, Star, Store, Truck, Utensils } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import PlatformShell from "../../../components/PlatformShell";
import { auth } from "../../../lib/firebase";
import { addCartItem, addRestaurantReview, getRestaurantBySlug, getRestaurantMenu, getRestaurantPosts, getRestaurantReviews } from "../../../lib/firestore";

export default function PublicRestaurantProfile() {
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const slug = typeof window !== "undefined" ? window.location.pathname.split("/").pop() : "";

  useEffect(() => onAuthStateChanged(auth, setUser), []);
  useEffect(() => {
    if (!slug) return;
    getRestaurantBySlug(slug).then(async (found) => {
      setRestaurant(found);
      if (!found) return;
      setMenu(await getRestaurantMenu(found.id).catch(() => []));
      await getRestaurantPosts(found.id).catch(() => []);
      setReviews(await getRestaurantReviews(found.id).catch(() => []));
    }).catch(() => setRestaurant(null));
  }, [slug]);

  const average = useMemo(() => reviews.length ? (reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length).toFixed(1) : restaurant?.rating || "-", [reviews, restaurant]);
  const visibleMenu = menu.slice(0, 6);

  async function add(item) {
    if (!user) { setMessage("Connectez-vous pour ajouter un plat au panier."); return; }
    try { await addCartItem(user.uid, { id: item.id, dish: item.name, price: Number(item.price || 0), restaurant: restaurant.id }); setMessage(`${item.name} a été ajouté au panier.`); } catch (error) { setMessage(error.message || "Impossible d'ajouter ce plat."); }
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: restaurant?.name || "Restaurant Miamgo", url }).catch(() => {});
    else await navigator.clipboard?.writeText(url);
    setMessage("Lien du restaurant copié.");
  }

  if (!restaurant) return <PlatformShell><main className="content-wrap"><section className="empty-state"><Store size={34} /><h1>Restaurant introuvable</h1><p>Ce restaurant n&apos;est pas disponible pour le moment.</p><Link href="/explorer">Retour à Explorer</Link></section></main></PlatformShell>;

  return <PlatformShell>
    <main className="restaurant-profile-page public-restaurant-profile">
      <Link className="public-profile-back" href="/explorer"><ArrowLeft size={17} />Retour aux restaurants</Link>
      <section className="restaurant-public-profile">
        <div className="restaurant-profile-cover" style={restaurant.coverURL ? { backgroundImage: `url(${restaurant.coverURL})` } : undefined}>
          <div className="restaurant-cover-copy"><p>{restaurant.category || "CUISINE DE COEUR"}</p><strong>{restaurant.name || "Restaurant Miamgo"}</strong></div>
        </div>
        <div className="restaurant-profile-body">
          <div className="restaurant-profile-avatar" style={restaurant.photoURL ? { backgroundImage: `url(${restaurant.photoURL})` } : undefined}>{!restaurant.photoURL && <Store size={24} />}</div>
          <div className="restaurant-profile-title"><p className="eyebrow">{restaurant.category || "RESTAURANT"}</p><h1>{restaurant.name || "Restaurant Miamgo"}</h1><p>{restaurant.description || "Les recettes généreuses de votre restaurant, préparées avec des produits frais."}</p><div className="restaurant-profile-facts"><span><Star size={15} fill="currentColor" />{average} <small>({reviews.length} avis)</small></span><span><Clock3 size={15} />25-35 min</span><span><MapPin size={15} />{restaurant.city || "Ville non renseignée"}{restaurant.country ? `, ${restaurant.country}` : ""}</span></div></div>
          <div className="restaurant-profile-actions"><button type="button" onClick={share} aria-label="Partager"><Share2 size={18} /></button><button type="button" className={saved ? "saved" : ""} onClick={() => setSaved((value) => !value)} aria-label="Ajouter aux favoris"><Heart size={19} fill={saved ? "currentColor" : "none"} /></button></div>
        </div>
      </section>
      <div className="restaurant-delivery-banner"><Truck size={22} /><div><strong>Livraison et retrait disponibles</strong><span>Livraison dès 700 FCFA selon votre position</span></div></div>
      <section className="restaurant-menu-showcase"><div className="restaurant-menu-heading"><div><p className="eyebrow">AUJOURD&apos;HUI CHEZ {String(restaurant.name || "MIAMGO").toUpperCase()}</p><h2>Le menu du jour</h2></div><span>{menu.length} plat{menu.length === 1 ? "" : "s"}</span></div>{message && <p className="settings-notice">{message}</p>}{visibleMenu.length ? <div className="restaurant-menu-cards">{visibleMenu.map((item) => <article className="restaurant-menu-card" key={item.id}><div className="restaurant-menu-thumb" style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : undefined}>{!item.imageUrl && <Utensils size={24} />}</div><div className="restaurant-menu-info"><strong>{item.name}</strong><small>{item.description || item.category || "Préparé avec des produits frais"}</small><b>{Number(item.price || 0).toLocaleString("fr-FR")} FCFA</b></div><button type="button" onClick={() => add(item)} aria-label={`Ajouter ${item.name}`}><Plus size={19} /></button></article>)}</div> : <div className="restaurant-menu-empty"><Utensils size={27} /><p>Le menu de ce restaurant sera bientôt disponible.</p></div>}</section>
    </main>
  </PlatformShell>;
}
