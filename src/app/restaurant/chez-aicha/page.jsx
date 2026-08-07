import Link from "next/link";
import { ArrowLeft, Clock3, Heart, MapPin, Plus, Star, Truck, UtensilsCrossed } from "lucide-react";
import PlatformShell from "../../../components/PlatformShell";

const menu = [
  ["Riz gras au poulet fumé", "Riz parfumé, poulet fumé, légumes et sauce maison.", "2 500 FCFA", "Le plus commandé", "#e96a3d"],
  ["Riz au gras simple", "Riz aux légumes, sauce tomate relevée et oeuf.", "1 500 FCFA", "", "#e7a936"],
  ["Poulet braisé entier", "Poulet mariné, attiéké ou alloco au choix.", "4 500 FCFA", "", "#624230"],
  ["Jus de bissap maison", "Frais, naturel et légèrement citronné.", "500 FCFA", "", "#a83a50"],
];

export default function RestaurantPage() {
  return <PlatformShell><main className="restaurant-page"><Link className="back-link" href="/explorer"><ArrowLeft size={17} />Retour aux restaurants</Link><section className="restaurant-banner"><div className="restaurant-banner-art"><UtensilsCrossed size={48} /><span>CHEZ<br />AÏCHA</span></div><div className="restaurant-intro"><div className="restaurant-title-row"><div><p className="eyebrow">CUISINE BÉNINOISE</p><h1>Chez Aïcha</h1></div><button><Heart size={19} /></button></div><p>Les recettes généreuses d&apos;Aïcha, cuisinées chaque matin avec des produits frais.</p><div className="restaurant-facts"><span><Star size={15} fill="currentColor" />4.8 <small>(126 avis)</small></span><span><Clock3 size={15} />25-35 min</span><span><MapPin size={15} />Cadjèhoun</span></div></div></section><div className="delivery-notice"><Truck size={19} /><div><strong>Livraison et retrait disponibles</strong><span>Livraison dès 700 FCFA selon votre position</span></div><b>Ouvert jusqu&apos;à 22:00</b></div><section className="menu-section"><div className="menu-main"><div className="section-heading"><div><p className="eyebrow">AUJOURD&apos;HUI CHEZ AÏCHA</p><h2>Le menu du jour</h2></div><span className="count-pill">{menu.length} plats</span></div><div className="menu-list">{menu.map(([name, description, price, tag, color]) => <article key={name}><div className="menu-thumb" style={{ background: `linear-gradient(135deg, ${color}, #ffc774)` }}><UtensilsCrossed size={26} /></div><div><div className="item-name"><h3>{name}</h3>{tag && <span>{tag}</span>}</div><p>{description}</p><strong>{price}</strong></div><button aria-label={`Ajouter ${name}`}><Plus size={20} /></button></article>)}</div></div><aside className="mini-cart"><div className="mini-cart-head"><h3>Votre panier</h3><span>1 plat</span></div><div className="cart-line"><span>1x</span><p>Riz gras au poulet fumé<small>2 500 FCFA</small></p></div><div className="cart-total"><span>Sous-total</span><strong>2 500 FCFA</strong></div><Link href="/panier">Voir le panier <span>→</span></Link></aside></section></main></PlatformShell>;
}
