import Link from "next/link";
import { ArrowLeft, Store } from "lucide-react";
import PlatformShell from "../../../components/PlatformShell";
export default function DriverAffiliations(){return <PlatformShell><main className="content-wrap driver-dashboard"><Link className="back-link" href="/espace-livreur"><ArrowLeft size={17}/>Retour à mon espace</Link><p className="eyebrow">MES AFFILIATIONS</p><h1>Restaurants affiliés</h1><section className="driver-empty"><Store size={32}/><h2>Aucun restaurant affilié</h2><p>Les restaurants qui vous enverront une invitation apparaîtront ici après acceptation.</p></section></main></PlatformShell>}
