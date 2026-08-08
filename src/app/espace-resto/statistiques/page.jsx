import { BarChart3, ShoppingBag, Truck, Wallet } from "lucide-react";
import PlatformShell from "../../../components/PlatformShell";

export default function RestaurantStats() {
  return <PlatformShell><main className="content-wrap restaurant-data-page"><p className="eyebrow">ANALYSE DE L'ACTIVITÉ</p><h1>Statistiques</h1><div className="stats-grid"><article><Wallet size={22}/><span>Chiffre d'affaires</span><strong>1 245 000 FCFA</strong><small>Ce mois</small></article><article><ShoppingBag size={22}/><span>Panier moyen</span><strong>2 420 FCFA</strong><small>+ 8% vs mois dernier</small></article><article><BarChart3 size={22}/><span>Meilleur plat</span><strong>Riz gras</strong><small>148 commandes</small></article><article><Truck size={22}/><span>Livraison</span><strong>62%</strong><small>38% retrait sur place</small></article></div><section className="data-section"><h2>Performance des livreurs</h2><p>Koffi Mensah · 28 courses terminées · Temps moyen: 31 min</p><p>Sonia Agossou · 19 courses terminées · Temps moyen: 29 min</p></section></main></PlatformShell>;
}
