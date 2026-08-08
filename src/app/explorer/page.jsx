"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, MapPin, Search, SlidersHorizontal, Star } from "lucide-react";
import PlatformShell from "../../components/PlatformShell";

const choices = [
  ["riz-sauces", "Riz & sauces", "36 restaurants", "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=500&q=85"],
  ["grillades", "Grillades", "18 restaurants", "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=500&q=85"],
  ["pates", "Pâtes", "24 restaurants", "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=500&q=85"],
  ["petit-dejeuner", "Petit-déjeuner", "12 restaurants", "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=500&q=85"],
  ["cocktails", "Cocktails", "15 restaurants", "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=85"],
];
const results = [["Chez Aïcha", "Riz gras, sauces et grillades", "4.8", "25-35 min", "Cadjèhoun", "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=85"], ["Mami Grill", "Poisson braisé, alloco", "4.9", "30-40 min", "Fidjrossè", "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=85"], ["Le Comptoir de Koffi", "Pâtes et plats du jour", "4.6", "20-30 min", "Akpakpa", "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=700&q=85"]];

export default function ExplorerPage() {
  const [query, setQuery] = useState(""); const [filterOpen, setFilterOpen] = useState(false);
  const visible = results.filter(([name, type]) => `${name} ${type}`.toLowerCase().includes(query.toLowerCase()));
  return <PlatformShell active="Explorer"><main className="content-wrap explorer-page"><section className="explorer-hero"><p className="eyebrow">TROUVER VOTRE PROCHAIN REPAS</p><h1>Explorez ce qui mijote près de vous.</h1><label className="large-search"><Search size={20} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Un plat, un restaurant, une envie..." /><button>Rechercher</button></label></section><section className="section-heading"><div><p className="eyebrow">PAR ENVIE</p><h2>Qu&apos;allez-vous déguster?</h2></div><button className="light-control" onClick={() => setFilterOpen(!filterOpen)}><SlidersHorizontal size={16} />Filtres</button></section>{filterOpen && <div className="filter-panel"><button>Livraison rapide</button><button>Promotions</button><button>Ouvert maintenant</button></div>}<div className="choice-grid">{choices.map(([slug, title, detail, image]) => <Link className="choice-card choice-photo" href={`/categorie/${slug}`} key={slug}><img src={image} alt={title} /><span className="choice-overlay" /><strong>{title}</strong><small>{detail}</small><ArrowRight size={17} /></Link>)}</div><section className="section-heading results-heading"><div><p className="eyebrow">OUVERTS MAINTENANT</p><h2>Les adresses appréciées</h2></div><Link href="/restaurant/chez-aicha">Voir la carte <ArrowRight size={15} /></Link></section><div className="restaurant-result-grid">{visible.map(([name, type, rating, time, place, image]) => <article className="restaurant-result" key={name}><div className="restaurant-cover"><img src={image} alt={name} /><b>Ouvert</b></div><div className="restaurant-result-info"><h3>{name}</h3><p>{type}</p><div><span><Star size={13} fill="currentColor" />{rating}</span><span><Clock3 size={13} />{time}</span><span><MapPin size={13} />{place}</span></div><Link href="/restaurant/chez-aicha">Voir le menu</Link></div></article>)}</div>{visible.length === 0 && <div className="empty-state"><Search size={34} /><h2>Aucun restaurant trouvé</h2><p>Essayez une autre recherche.</p></div>}</main></PlatformShell>;
}
