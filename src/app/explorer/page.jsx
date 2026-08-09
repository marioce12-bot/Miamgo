"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import PlatformShell from "../../components/PlatformShell";

export default function ExplorerPage() {
  const [query, setQuery] = useState("");
  return <PlatformShell active="Explorer"><main className="content-wrap explorer-page"><section className="explorer-hero"><p className="eyebrow">TROUVER VOTRE PROCHAIN REPAS</p><h1>Explorez ce qui mijote près de vous.</h1><label className="large-search"><Search size={20}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Un plat, un restaurant, une envie..."/><button type="button">Rechercher</button></label></section><section className="empty-state"><Search size={34}/><h2>{query ? "Aucun résultat" : "Aucun restaurant disponible"}</h2><p>Les restaurants et leurs menus apparaîtront ici dès leur inscription et leur activation.</p></section></main></PlatformShell>;
}
