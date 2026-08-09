import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import PlatformShell from "../../components/PlatformShell";

export default function CartPage() {
  return <PlatformShell active="Panier"><main className="content-wrap cart-page"><p className="eyebrow">VOTRE COMMANDE</p><h1>Votre panier</h1><section className="empty-cart"><ShoppingBag size={34}/><h2>Votre panier est vide</h2><p>Les plats ajoutés depuis un restaurant actif apparaîtront ici.</p><Link href="/explorer">Explorer les restaurants</Link></section></main></PlatformShell>;
}
