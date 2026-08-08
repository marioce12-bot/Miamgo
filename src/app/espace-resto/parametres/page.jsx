"use client";

import { useState } from "react";
import { Save, Users } from "lucide-react";
import PlatformShell from "../../../components/PlatformShell";
export default function RestaurantSettings() { const [notice, setNotice] = useState(""); return <PlatformShell><main className="content-wrap restaurant-settings-page"><p className="eyebrow">PARAMÈTRES PROFESSIONNELS</p><h1>Informations du responsable</h1><form onSubmit={(event) => { event.preventDefault(); setNotice("Paramètres enregistrés."); }}><label>Nom complet<input defaultValue="Aïcha A." /></label><label>E-mail professionnel<input type="email" defaultValue="contact@chezaicha.bj" /></label><label>Numéro WhatsApp<input defaultValue="+229 00 00 00 00" /></label><label>Nouveau mot de passe<input type="password" placeholder="Laisser vide pour ne pas modifier" /></label><button><Save size={16}/>Enregistrer</button></form>{notice && <p className="settings-notice">{notice}</p>}<section className="employees-section"><h2><Users size={18}/>Employés</h2><p>Gérez les employés ayant le droit de préparer et valider les retraits.</p><button>Inviter un employé</button></section></main></PlatformShell> }
