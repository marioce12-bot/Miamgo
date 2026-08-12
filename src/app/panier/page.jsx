"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import PlatformShell from "../../components/PlatformShell";
import { auth } from "../../lib/firebase";
import { getCart } from "../../lib/firestore";
export default function CartPage(){const [cart,setCart]=useState({items:[]});const [loading,setLoading]=useState(true);useEffect(()=>onAuthStateChanged(auth,async(user)=>{if(!user){setLoading(false);return;}setCart(await getCart(user.uid).catch(()=>({items:[]})));setLoading(false);}),[]);const items=cart.items||[];return <PlatformShell active="Panier"><main className="content-wrap cart-page"><p className="eyebrow">VOTRE COMMANDE</p><h1>Votre panier</h1>{loading?<p>Chargement du panier...</p>:items.length?<section className="cart-items">{items.map((item)=><article key={item.id}><div><strong>{item.name||item.dish}</strong><small>{item.price} FCFA · {item.quantity||1} article(s)</small></div><div className="cart-item-actions"><button><Minus size={14}/></button><b>{item.quantity||1}</b><button><Plus size={14}/></button><button><Trash2 size={15}/></button></div></article>)}<button className="dashboard-primary-action">Passer la commande</button></section>:<section className="empty-cart"><ShoppingBag size={34}/><h2>Votre panier est vide</h2><p>Les plats ajoutés depuis un restaurant actif apparaîtront ici.</p><Link href="/explorer">Explorer les restaurants</Link></section>}</main></PlatformShell>}