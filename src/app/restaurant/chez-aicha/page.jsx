"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock3, Heart, MapPin, Plus, Star, Truck, UtensilsCrossed } from "lucide-react";
import PlatformShell from "../../../components/PlatformShell";

const menu = [
  ["Riz gras au poulet fumé", "Riz parfumé, poulet fumé, légumes et sauce maison.", 2500, "Le plus commandé", "#e96a3d"],
  ["Riz au gras simple", "Riz aux légumes, sauce tomate relevée et oeuf.", 1500, "", "#e7a936"],
  ["Poulet braisé entier", "Poulet mariné, attiéké ou alloco au choix.", 4500, "", "#624230"],
  ["Jus de bissap maison", "Frais, naturel et légèrement citronné.", 500, "", "#a83a50"],
];

export default function RestaurantPage() {
  const [favorite, setFavorite] = useState(false);
  const [cart, setCart] = useState([]);
  const total = cart.reduce((sum, item) => sum + item[2], 0);
  return <PlatformShell><main className="restaurant-page"><Link className="back-link" href="/explorer"><ArrowLeft size={17} />Retour aux restaurants</Link><section className="restaurant-banner"><div className="restaurant-banner-art"><UtensilsCrossed size={48} /><span>CHEZ<br />AÏCHA</span></div><div className="restaurant-intro"><div className="restaurant-title-row"><div><p className="eyebrow">CUISINE BÉNINOISE</p><h1>Chez Aïcha</h1></div><button className={favorite ? "restaurant-favorite" : ""} onClick={() => setFavorite(!favorite)} aria-label="Ajouter aux favoris"><Heart size={19} fill={favorite ? "currentColor" : "none"} /></button></div><p>Les recettes généreuses d&apos;Aïcha, cuisinées chaque matin avec des produits frais.</p><div className="restaurant-facts"><span><Star size={15} fill="currentColor" />4.8 <small>(126 avis)</small></span><span><Clock3 size={15} />25-35 min</span><span><MapPin size={15} />Cadjèhoun</span></div></div></section><div className="delivery-notice"><Truck size={19} /><div><strong>Livraison et retrait disponibles</strong><span>Livraison dès 700 FCFA selon votre position</span></div><b>Ouvert jusqu&apos;à 22:00</b></div><section className="menu-section"><div className="menu-main"><div className="section-heading"><div><p className="eyebrow">AUJOURD&apos;HUI CHEZ AÏCHA</p><h2>Le menu du jour</h2></div><span className="count-pill">{menu.length} plats</span></div><div className="menu-list">{menu.map((item) => <article key={item[0]}><div className="menu-thumb" style={{ background: `linear-gradient(135deg, ${item[4]}, #ffc774)` }}><UtensilsCrossed size={26} /></div><div><div className="item-name"><h3>{item[0]}</h3>{item[3] && <span>{item[3]}</span>}</div><p>{item[1]}</p><strong>{item[2].toLocaleString("fr-FR")} FCFA</strong></div><button aria-label={`Ajouter ${item[0]}`} onClick={() => setCart((current) => [...current, item])}><Plus size={20} /></button></article>)}</div></div><aside className="mini-cart"><div className="mini-cart-head"><h3>Votre panier</h3><span>{cart.length} plat{cart.length !== 1 ? "s" : ""}</span></div>{cart.length === 0 ? <p className="mini-cart-empty">Ajoutez un plat pour commencer votre commande.</p> : <><div className="cart-line"><span>{cart.length}x</span><p>{cart.at(-1)[0]}<small>{total.toLocaleString("fr-FR")} FCFA</small></p></div><div className="cart-total"><span>Sous-total</span><strong>{total.toLocaleString("fr-FR")} FCFA</strong></div><Link href="/panier">Voir le panier <span>→</span></Link></>}</aside></section></main></PlatformShell>;
}
