import Link from "next/link";
import { Store } from "lucide-react";
import PlatformShell from "../../../components/PlatformShell";

export default function RestaurantPage() {
  return <PlatformShell><main className="restaurant-page"><section className="empty-state"><Store size={38}/><h1>Restaurant indisponible</h1><p>Ce restaurant de démonstration a été retiré. Les restaurants actifs apparaîtront ici depuis les données réelles.</p><Link href="/explorer">Retour à l’exploration</Link></section></main></PlatformShell>;
}
