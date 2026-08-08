import { BarChart3 } from "lucide-react";
import PlatformShell from "../../../components/PlatformShell";
export default function RestaurantStats(){return <PlatformShell><main className="content-wrap restaurant-data-page"><p className="eyebrow">ANALYSE DE L&apos;ACTIVITÉ</p><h1>Statistiques</h1><div className="admin-table-placeholder"><BarChart3 size={32}/><h3>Aucune statistique disponible</h3><p>Les ventes, commandes, panier moyen et performances des livreurs apparaîtront ici après vos premières données réelles.</p></div></main></PlatformShell>}
