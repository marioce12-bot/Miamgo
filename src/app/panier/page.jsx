"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import PlatformShell from "../../components/PlatformShell";

const initialItems = [
  { id: "riz", name: "Riz gras au poulet fumé", detail: "Portion normale · Sauce piquante à part", price: 2500, icon: "🍛" },
  { id: "bissap", name: "Jus de bissap maison", detail: "Frais · 50 cl", price: 500, icon: "🧃" },
];

export default function CartPage() {
  const [items, setItems] = useState(initialItems.map((item) => ({ ...item, quantity: 1 })));
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  function changeQuantity(id, delta) { setItems((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item)); }
  function remove(id) { setItems((current) => current.filter((item) => item.id !== id)); }
  return <PlatformShell active="Panier"><main className="content-wrap cart-page"><p className="eyebrow">VOTRE COMMANDE</p><h1>Votre panier <span>({items.length} article{items.length !== 1 ? "s" : ""})</span></h1>{items.length === 0 ? <section className="empty-cart"><ShoppingBag size={34} /><h2>Votre panier est vide</h2><p>Découvrez les plats proposés près de chez vous.</p><Link href="/explorer">Explorer les restaurants</Link></section> : <div className="cart-layout"><section className="cart-items"><div className="cart-restaurant"><div><span>CA</span><p><strong>Chez Aïcha</strong><small>Cadjèhoun · Livraison disponible</small></p></div><Link href="/restaurant/chez-aicha">Modifier</Link></div>{items.map((item) => <article className="cart-item" key={item.id}><div className={`cart-item-image ${item.id === "bissap" ? "drink" : ""}`}>{item.icon}</div><div><h2>{item.name}</h2><p>{item.detail}</p><strong>{item.price.toLocaleString("fr-FR")} FCFA</strong></div><div className="quantity"><button aria-label="Réduire" onClick={() => changeQuantity(item.id, -1)}><Minus size={14} /></button><b>{item.quantity}</b><button aria-label="Augmenter" onClick={() => changeQuantity(item.id, 1)}><Plus size={14} /></button></div><button className="delete" aria-label={`Supprimer ${item.name}`} onClick={() => remove(item.id)}><Trash2 size={17} /></button></article>)}<div className="add-more"><ShoppingBag size={18} /><p><strong>Une petite envie en plus?</strong><span>Ajoutez d&apos;autres plats de Chez Aïcha.</span></p><Link href="/restaurant/chez-aicha">Voir le menu <ChevronRight size={16} /></Link></div></section><aside className="summary-card"><h2>Récapitulatif</h2><div><span>Sous-total</span><strong>{total.toLocaleString("fr-FR")} FCFA</strong></div><div><span>Frais de service</span><strong>0 FCFA</strong></div><div className="delivery-estimate"><Truck size={17} /><p>Les frais de livraison seront calculés selon votre adresse.</p></div><div className="summary-total"><span>Total estimé</span><strong>{total.toLocaleString("fr-FR")} FCFA</strong></div><Link href="/checkout">Passer la commande <ChevronRight size={18} /></Link><small>Vous choisirez le mode de livraison au prochain écran.</small></aside></div>}</main></PlatformShell>;
}
