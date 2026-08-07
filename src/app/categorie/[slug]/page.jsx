import Link from "next/link";
import { ArrowLeft, Clock3, MapPin, Star } from "lucide-react";
import PlatformShell from "../../../components/PlatformShell";

const categories = {
  "riz-sauces": { title: "Riz & sauces", subtitle: "Les plats généreux qui font plaisir", meals: [["Riz gras au poulet fumé", "Chez Aïcha", "2 500 FCFA", "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=85"], ["Riz sauce arachide", "Bénin Délices", "2 000 FCFA", "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=700&q=85"]] },
  grillades: { title: "Grillades", subtitle: "Braisé, croustillant et bien assaisonné", meals: [["Poulet braisé entier", "Mami Grill", "4 500 FCFA", "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=700&q=85"], ["Poisson braisé & alloco", "Mami Grill", "3 000 FCFA", "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=85"]] },
  pates: { title: "Pâtes", subtitle: "Les plats réconfortants à toute heure", meals: [["Spaghetti bolognaise", "Le Comptoir de Koffi", "1 800 FCFA", "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=700&q=85"], ["Pâtes au poulet", "Sawa Kitchen", "2 300 FCFA", "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=700&q=85"]] },
  "petit-dejeuner": { title: "Petit-déjeuner", subtitle: "Pour bien démarrer votre journée", meals: [["Petit-déjeuner complet", "La Terrasse", "2 000 FCFA", "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=700&q=85"], ["Crêpes fruits frais", "Sawa Kitchen", "1 500 FCFA", "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=700&q=85"]] },
};

export default function CategoryPage({ params }) {
  const category = categories[params.slug] || categories["riz-sauces"];
  return <PlatformShell active="Explorer"><main className="content-wrap category-page"><Link className="back-link" href="/explorer"><ArrowLeft size={17} />Retour à Explorer</Link><p className="eyebrow">CATÉGORIE</p><h1>{category.title}</h1><p className="category-subtitle">{category.subtitle}</p><div className="meal-category-grid">{category.meals.map(([name, restaurant, price, image]) => <article key={name}><img src={image} alt={name} /><div><p>{restaurant}</p><h2>{name}</h2><span><Star size={13} fill="currentColor" />4.8 · <Clock3 size={13} />25-35 min · <MapPin size={13} />Cotonou</span><strong>{price}</strong><Link href="/restaurant/chez-aicha">Voir le restaurant</Link></div></article>)}</div></main></PlatformShell>;
}
