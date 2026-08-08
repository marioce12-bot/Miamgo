"use client";

import { useState } from "react";
import { Activity, Ban, CheckCircle2, LogOut, ShieldCheck, Users } from "lucide-react";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false); const [password, setPassword] = useState(""); const [error, setError] = useState("");
  async function login(event) { event.preventDefault(); const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) }); if (response.ok) setAuthenticated(true); else setError("Mot de passe administrateur invalide."); }
  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); setAuthenticated(false); }
  if (!authenticated) return <main className="admin-login"><section><ShieldCheck size={35}/><p className="eyebrow">ZONE PRIVÉE MIAMGO</p><h1>Administration</h1><p>Cette interface est réservée à l&apos;équipe créatrice.</p><form onSubmit={login}><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mot de passe administrateur" required /><button>Accéder</button></form>{error && <small>{error}</small>}</section></main>;
  return <main className="admin-page"><header><div><p className="eyebrow">CONSOLE MIAMGO</p><h1>Vue plateforme</h1></div><button onClick={logout}><LogOut size={17}/>Déconnexion</button></header><div className="admin-metrics"><article><Users size={22}/><span>Utilisateurs</span><strong>0</strong></article><article><CheckCircle2 size={22}/><span>Restaurants actifs</span><strong>0</strong></article><article><Activity size={22}/><span>Commandes aujourd&apos;hui</span><strong>0</strong></article><article><Ban size={22}/><span>Comptes suspendus</span><strong>0</strong></article></div><section className="admin-empty"><h2>Centre de contrôle</h2><p>Les données réelles seront chargées par l&apos;API Admin Firebase. Cette zone n&apos;est jamais liée depuis les applications mobiles.</p></section></main>;
}
