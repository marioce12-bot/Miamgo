import { Bike } from "lucide-react";
import PlatformShell from "../../components/PlatformShell";

export default function DriversPage() {
  return <PlatformShell><main className="content-wrap drivers-page"><p className="eyebrow">LIVRAISON</p><h1>Mes livreurs</h1><section className="empty-state"><Bike size={36}/><h2>Aucun livreur enregistré</h2><p>Les livreurs affiliés et disponibles apparaîtront ici avec leurs données réelles.</p></section></main></PlatformShell>;
}
