"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, Save, Settings } from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import PlatformShell from "../../components/PlatformShell";
import { auth } from "../../lib/firebase";
import { getUserProfile, updateProfileSettings } from "../../lib/firestore";

export default function CustomerProfile() {
  const [user, setUser] = useState(null); const [profile, setProfile] = useState(null); const [settings, setSettings] = useState(false); const [notice, setNotice] = useState(""); const router = useRouter();
  useEffect(() => onAuthStateChanged(auth, async (session) => { setUser(session); if (!session) return; const data = await getUserProfile(session.uid).catch(() => null); if (data?.role === "restaurant_owner") { router.replace("/espace-resto"); return; } if (data?.role === "driver") { router.replace("/espace-livreur"); return; } setProfile(data); }), [router]);
  if (!user) return <PlatformShell><main className="content-wrap empty-state"><h2>Connectez-vous pour accéder à votre profil.</h2><button onClick={() => router.push("/connexion")}>Se connecter</button></main></PlatformShell>;
  const current = profile || { displayName: user.email?.split("@")[0] || "Mon compte", email: user.email || "", phone: "", city: "", country: "" };
  async function save(event) { event.preventDefault(); const form = new FormData(event.currentTarget); const changes = { displayName: form.get("name"), phone: form.get("phone"), city: form.get("city"), country: form.get("country") }; try { await updateProfileSettings(user.uid, changes); setProfile({ ...current, ...changes }); setNotice("Paramètres enregistrés."); } catch { setNotice("Impossible d'enregistrer les paramètres. Vérifiez les règles Firestore."); } }
  return <PlatformShell><main className="content-wrap profile-page"><div className="profile-heading"><div className="profile-avatar">{current.displayName.slice(0,2).toUpperCase()}</div><div><p className="eyebrow">ESPACE CLIENT</p><h1>{current.displayName}</h1><p>{current.email} · {current.city}{current.country && `, ${current.country}`}</p></div><button onClick={() => setSettings(!settings)}><Settings size={17} />Paramètres</button><button className="logout-button" onClick={async () => { await signOut(auth); router.push("/"); }}><LogOut size={17} />Déconnexion</button></div>{settings ? <section className="profile-panel settings-panel"><h2>Paramètres du compte</h2><form onSubmit={save}><label>Nom complet<input name="name" defaultValue={current.displayName} required /></label><label>Téléphone<input name="phone" defaultValue={current.phone || ""} /></label><label>Pays<select name="country" defaultValue={current.country || "BJ"}><option value="BJ">Bénin (BJ)</option><option value="CI">Côte d&apos;Ivoire (CI)</option><option value="TG">Togo (TG)</option><option value="SN">Sénégal (SN)</option></select></label><label>Ville<input name="city" defaultValue={current.city || "Cotonou"} required /></label><label>E-mail<input value={current.email} disabled /></label><button><Save size={16} />Enregistrer</button></form>{notice && <p className="settings-notice">{notice}</p>}</section> : <div className="profile-grid"><section><h2>Commande en cours</h2><article className="profile-order"><div><strong>Chez Aïcha · #MG-0842</strong><p>Riz gras au poulet fumé · En préparation</p></div><Link href="/commandes">Suivre</Link></article><h2>Historique</h2><Link className="history-link" href="/commandes">Voir toutes vos commandes →</Link></section><aside><h2>Vos raccourcis</h2><Link href="/panier">Mon panier</Link><Link href="/explorer">Restaurants favoris</Link></aside></div>}</main></PlatformShell>;
}
