import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import PlatformShell from "../../../components/PlatformShell";

export default function CategoryPage() {
  return <PlatformShell active="Explorer"><main className="content-wrap category-page"><Link className="back-link" href="/explorer"><ArrowLeft size={17}/>Retour à Explorer</Link><p className="eyebrow">CATÉGORIE</p><h1>Plats disponibles</h1><section className="empty-state"><Search size={34}/><h2>Aucun plat disponible</h2><p>Les plats publiés par les restaurants actifs apparaîtront ici.</p></section></main></PlatformShell>;
}
