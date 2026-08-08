"use client";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import PlatformShell from "../../../components/PlatformShell";
export default function DriverSettings(){return <PlatformShell><main className="content-wrap driver-dashboard"><Link className="back-link" href="/espace-livreur/profil"><ArrowLeft size={17}/>Retour au profil</Link><p className="eyebrow">PARAMÈTRES DU COMPTE</p><h1>Paramètres</h1><form className="driver-settings-form" onSubmit={(event)=>event.preventDefault()}><label>Langue<select defaultValue="fr"><option value="fr">Français</option><option value="en">English</option></select></label><label>Thème<select defaultValue="light"><option value="light">Clair</option><option value="dark">Sombre</option></select></label><button><Save size={16}/>Enregistrer</button></form></main></PlatformShell>}
