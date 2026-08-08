import Link from "next/link";
import { Settings, Wallet } from "lucide-react";
import PlatformShell from "../../../components/PlatformShell";
export default function DriverProfile(){return <PlatformShell><main className="content-wrap driver-dashboard"><p className="eyebrow">COMPTE LIVREUR</p><h1>Mon profil</h1><section className="driver-feature-grid"><Link href="/espace-livreur/paiement"><Wallet size={22}/><strong>Abonnement</strong><small>Validation requise avant paiement</small></Link><Link href="/espace-livreur"><Settings size={22}/><strong>Paramètres</strong><small>Langue, thème et informations personnelles</small></Link></section></main></PlatformShell>}
