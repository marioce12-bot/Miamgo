"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImagePlus, Save } from "lucide-react";
import PlatformShell from "../../../components/PlatformShell";
import { saveRestaurantIdentity } from "../../../lib/firestore";

export default function RestaurantProfileSettings() {
  const [avatar, setAvatar] = useState(""); const [banner, setBanner] = useState(""); const [notice, setNotice] = useState("");
  async function save(event) { event.preventDefault(); try { await saveRestaurantIdentity("chez-aicha", { avatarUrl: avatar || null, bannerUrl: banner || null }); setNotice("Images enregistrées pour le profil restaurant."); } catch { setNotice("Firestore doit être activé pour enregistrer les images."); } }
  return <PlatformShell><main className="content-wrap restaurant-settings"><Link className="back-link" href="/espace-resto"><ArrowLeft size={17} />Retour au dashboard</Link><p className="eyebrow">PROFIL RESTAURANT</p><h1>Photo et bannière</h1><p>Personnalisez le profil visible par les clients avec vos liens Imgbb.</p><form onSubmit={save}><section><div className="image-preview avatar-preview" style={avatar ? { backgroundImage: `url(${avatar})` } : {}}>CA</div><label>URL photo de profil<input value={avatar} onChange={(event) => setAvatar(event.target.value)} placeholder="Lien Imgbb de votre logo" /></label></section><section><div className="image-preview banner-preview" style={banner ? { backgroundImage: `url(${banner})` } : {}}><ImagePlus size={28} /></div><label>URL bannière<input value={banner} onChange={(event) => setBanner(event.target.value)} placeholder="Lien Imgbb de votre bannière" /></label></section><button><Save size={17} />Enregistrer</button>{notice && <p className="settings-notice">{notice}</p>}</form><section className="post-history"><h2>Historique des publications</h2><article><strong>Riz gras au poulet fumé</strong><p>Aujourd&apos;hui · 126 j&apos;aime · 14 commentaires</p></article><article><strong>Promotion déjeuner</strong><p>Hier · 74 j&apos;aime · 9 commentaires</p></article></section></main></PlatformShell>;
}
