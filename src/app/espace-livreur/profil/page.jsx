"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, Link2, Save, Settings, Wallet } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import PlatformShell from "../../../components/PlatformShell";
import { auth } from "../../../lib/firebase";
import { getUserProfile, updateProfileSettings } from "../../../lib/firestore";
import { uploadImageFile } from "../../../lib/storage";

export default function DriverProfile() {
  const [user, setUser] = useState(null); const [profile, setProfile] = useState(null); const [notice, setNotice] = useState(""); const [uploading, setUploading] = useState(false);
  useEffect(() => onAuthStateChanged(auth, async (session) => { setUser(session); if (session) setProfile(await getUserProfile(session.uid).catch(() => null)); }), []);
  async function uploadPhoto(event) { const file = event.target.files?.[0]; if (!file || !user) return; setUploading(true); setNotice(""); try { const photoURL = await uploadImageFile(file, { maxWidth: 600, quality: 0.82 }); await updateProfileSettings(user.uid, { photoURL }); setProfile((current) => ({ ...current, photoURL })); setNotice("Photo de profil enregistrée."); } catch (error) { setNotice(error.message || "Impossible de téléverser la photo."); } finally { setUploading(false); } }
  return <PlatformShell><main className="content-wrap driver-dashboard"><section className="driver-profile-card"><div className="driver-profile-avatar" style={profile?.photoURL ? { backgroundImage: `url(${profile.photoURL})` } : undefined}>{!profile?.photoURL && (profile?.displayName?.slice(0, 2).toUpperCase() || "LI")}<label><Camera size={15}/><input type="file" accept="image/*" onChange={uploadPhoto}/></label></div><div><p className="eyebrow">PROFIL LIVREUR</p><h1>{profile?.displayName || "Mon profil"}</h1><p>{profile?.city || "Ville non renseignée"}{profile?.country ? `, ${profile.country}` : ""}</p></div></section>{uploading && <p className="settings-notice">Téléversement de la photo…</p>}{notice && <p className="settings-notice">{notice}</p>}<section className="driver-feature-grid"><Link href="/espace-livreur/affiliations"><Link2 size={22}/><strong>Restaurants affiliés</strong><small>Voir les restaurants qui vous ont recruté</small></Link><Link href="/espace-livreur/paiement"><Wallet size={22}/><strong>Abonnement</strong><small>Validation requise avant paiement</small></Link><Link href="/espace-livreur"><Settings size={22}/><strong>Paramètres</strong><small>Langue, thème et informations personnelles</small></Link></section></main></PlatformShell>;
}
