"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Search, ShoppingBag, Star, X } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import PlatformShell from "../../components/PlatformShell";
import { auth } from "../../lib/firebase";
import { addCartItem, getExplorerItems } from "../../lib/firestore";

const categories = ["Tous", "Plats du jour", "Grillades", "Boissons", "Cocktails", "Promotions"];

export default function ExplorerPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tous");
  const [selected, setSelected] = useState(null);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const stop = onAuthStateChanged(auth, setUser);
    getExplorerItems().then(setItems).catch(() => setItems([]));
    return stop;
  }, []);

  useEffect(() => {
    if (!selected) return undefined;
    const closeOnEscape = (event) => event.key === "Escape" && setSelected(null);
    document.addEventListener("keydown", closeOnEscape);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.classList.remove("modal-open");
    };
  }, [selected]);

  const filtered = useMemo(() => items.filter((item) => {
    const text = `${item.name || ""} ${item.restaurantName || ""} ${item.category || ""}`.toLowerCase();
    return (category === "Tous" || item.category === category) && text.includes(query.toLowerCase());
  }), [items, query, category]);

  async function addToCart(item) {
    if (!user) {
      setMessage("Connectez-vous pour ajouter un plat au panier.");
      return;
    }
    setAdding(true);
    setMessage("");
    try {
      await addCartItem(user.uid, {
        id: item.id,
        dish: item.name,
        price: Number(item.price || 0),
        restaurant: item.restaurantId,
      });
      setMessage(`${item.name} a été ajouté au panier.`);
      setSelected(null);
    } catch (error) {
      setMessage(error.message || "Impossible d’ajouter ce plat.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <PlatformShell active="Explorer">
      <main className="content-wrap explorer-pinterest">
        <section className="explorer-hero">
          <p className="eyebrow">EXPLORER MIAMGO</p>
          <h1>Les plats qui donnent envie.</h1>
          <p>Découvrez les menus réels des restaurants actifs près de vous.</p>
          <label className="large-search">
            <Search size={20} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Plat, restaurant, catégorie..." />
          </label>
        </section>
        <div className="explorer-category-row">
          {categories.map((item) => <button type="button" className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item}>{item}</button>)}
        </div>
        {message && <p className="settings-notice">{message}</p>}
        {filtered.length ? <section className="pinterest-grid">
          {filtered.map((item) => <button type="button" className="pinterest-card" onClick={() => setSelected(item)} key={`${item.restaurantId}-${item.id}`}>
            <div className="pinterest-image">{item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <div className="pinterest-placeholder">{(item.name || "M").slice(0, 1).toUpperCase()}</div>}</div>
            <div className="pinterest-card-copy"><strong>{item.name}</strong><small>{item.restaurantName || "Restaurant Miamgo"}</small><span><Star size={12} fill="currentColor" />{item.rating || "Nouveau"} <b>{item.price ? `${Number(item.price).toLocaleString("fr-FR")} FCFA` : ""}</b></span></div>
          </button>)}
        </section> : <section className="empty-state"><Search size={34} /><h2>Aucun plat trouvé</h2><p>Essayez un autre plat ou une autre catégorie.</p></section>}
      </main>
      {selected && <div className="explorer-modal-backdrop" role="presentation" onClick={() => setSelected(null)}>
        <section className="explorer-modal" role="dialog" aria-modal="true" aria-labelledby="explorer-modal-title" onClick={(event) => event.stopPropagation()}>
          <button type="button" className="explorer-modal-close" onClick={() => setSelected(null)} aria-label="Fermer"><X size={20} /></button>
          <div className="explorer-modal-image">{selected.imageUrl ? <img src={selected.imageUrl} alt={selected.name} /> : <div className="pinterest-placeholder">{(selected.name || "M").slice(0, 1).toUpperCase()}</div>}</div>
          <div className="explorer-modal-content">
            <p className="eyebrow">{selected.category || "PLAT MIAMGO"}</p>
            <h2 id="explorer-modal-title">{selected.name}</h2>
            <p className="explorer-modal-restaurant"><MapPin size={15} />{selected.restaurantName || "Restaurant Miamgo"} · {selected.city || "Cotonou"}</p>
            <strong className="explorer-modal-price">{selected.price ? `${Number(selected.price).toLocaleString("fr-FR")} FCFA` : "Prix sur demande"}</strong>
            <div className="explorer-modal-actions">
              <button type="button" className="explorer-add-button" onClick={() => addToCart(selected)} disabled={adding}><ShoppingBag size={17} />{adding ? "Ajout..." : "Ajouter au panier"}</button>
              <Link className="explorer-visit-button" href={`/restaurant/${selected.restaurantSlug || selected.restaurantId}`} onClick={() => setSelected(null)}>Voir le restaurant <ArrowRight size={16} /></Link>
            </div>
          </div>
        </section>
      </div>}
    </PlatformShell>
  );
}
