"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, CheckCircle2, Link2, Settings, Wallet } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import PlatformShell from "../../../components/PlatformShell";
import { auth } from "../../../lib/firebase";
import { getUserProfile, updateProfileSettings } from "../../../lib/firestore";
import { uploadImageFile } from "../../../lib/storage";

export default function DriverProfile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => onAuthStateChanged(auth, async (session) => {
    setUser(session);
    if (session) setProfile(await getUserProfile(session.uid).catch(() => null));
  }), []);

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    try {
      const photoURL = await uploadImageFile(file, { maxWidth: 600, quality: .82 });
      await updateProfileSettings(user.uid, { photoURL });
      setProfile({ ...profile, photoURL });
      setNotice("Photo enregistrée.");
    } catch { setNotice("Impossible d’enregistrer la photo."); }
  }

  const validated = profile?.verificationStatus === "approved";
  return <PlatformShell><main className="content-wrap driver-profile-page">
    <section className="driver-profile-card"><div className="driver-profile-avatar" style={profile?.photoURL ? { backgroundImage: `url(${profile.photoURL})` } : {}}>{!profile?.photoURL && (profile?.displayName?.slice(0, 2).toUpperCase() || "LI")}<label><Camera size={15}/><input type="file" accept="image/*" onChange={upload}/></label></div><div><p className="eyebrow">PROFIL LIVREUR</p><h1>{profile?.displayName || "Mon profil"}</h1><p>{profile?.city || "Ville non renseignée"}{profile?.country ? `, ${profile.country}` : ""}</p></div></section>
    {notice && <p className="settings-notice">{notice}</p>}
    <section className={`driver-validation-card ${validated ? "is-validated" : ""}`}><CheckCircle2 size={21}/><div><strong>{validated ? "Compte validé" : "Validation en attente"}</strong><p>{validated ? "Votre identité a été vérifiée par l’administration." : "Votre pièce d’identité est en cours de vérification."}</p></div></section>
    <section className="driver-personal-info"><p className="eyebrow">INFORMATIONS PERSONNELLES</p><div><span>Nom</span><strong>{profile?.displayName || "Non renseigné"}</strong></div><div><span>E-mail</span><strong>{user?.email || "Non renseigné"}</strong></div><div><span>Téléphone</span><strong>{profile?.phone || "Non renseigné"}</strong></div><div><span>Ville</span><strong>{profile?.city || "Non renseignée"}</strong></div></section>
    <section className="driver-feature-grid"><Link href="/espace-livreur/affiliations"><Link2 size={22}/><strong>Restaurants affiliés</strong><small>Voir vos affiliations</small></Link><Link href="/espace-livreur/paiement"><Wallet size={22}/><strong>Abonnement</strong><small>Gérer le statut et le paiement</small></Link><Link href="/espace-livreur/parametres"><Settings size={22}/><strong>Paramètres</strong><small>Modifier les préférences du compte</small></Link></section>
  </main></PlatformShell>;
}
