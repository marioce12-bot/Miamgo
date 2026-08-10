"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bike, Check, Clock3, Info, LogOut, Power, QrCode, Wallet, X } from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import PlatformShell from "../../components/PlatformShell";
import { auth } from "../../lib/firebase";
import { getUserProfile, publishDriverDirectory, updateProfileSettings } from "../../lib/firestore";

function formatExpiry(profile) {
  const timestamp = profile?.subscriptionExpiresAt;
  if (!timestamp) return "Date d’échéance non définie";
  const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  return Number.isNaN(date.getTime()) ? "Date d’échéance non définie" : `Échéance : ${date.toLocaleDateString("fr-FR")}`;
}

function hasActiveSubscription(profile) {
  if (profile?.subscriptionStatus !== "active") return false;
  const timestamp = profile?.subscriptionExpiresAt;
  if (!timestamp) return true;
  const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}

export default function DriverDashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [notice, setNotice] = useState("");
  const [pendingRequest, setPendingRequest] = useState(null);
  const router = useRouter();

  useEffect(() => onAuthStateChanged(auth, async (session) => {
    setUser(session);
    if (session) setProfile(await getUserProfile(session.uid).catch(() => null));
  }), []);

  const verified = profile?.verificationStatus === "approved";
  const active = hasActiveSubscription(profile);
  const available = profile?.availabilityStatus === "available";

  async function toggleAvailability() {
    if (!user || !verified || !active) return;
    const availabilityStatus = available ? "unavailable" : "available";
    try {
      const nextProfile = { ...profile, availabilityStatus };
      await updateProfileSettings(user.uid, { availabilityStatus });
      await publishDriverDirectory(user.uid, nextProfile);
      setProfile(nextProfile);
      setNotice(availabilityStatus === "available" ? "Vous êtes maintenant visible par les restaurants." : "Vous êtes indisponible : aucune nouvelle demande ne vous sera proposée.");
    } catch { setNotice("Impossible d’enregistrer votre disponibilité."); }
  }

  function respondToRequest(decision) {
    setPendingRequest(null);
    setNotice(decision === "accept" ? "Demande acceptée." : "Demande refusée.");
  }

  return <PlatformShell><main className="content-wrap driver-dashboard">
    <header className="driver-dashboard-header"><div><p className="eyebrow">ACCUEIL LIVREUR</p><h1>{profile?.displayName ? `Bonjour, ${profile.displayName}.` : "Mon tableau de bord"}</h1><p>Gérez votre disponibilité et vos demandes de course.</p></div><button className="driver-logout" onClick={async () => { await signOut(auth); router.replace("/"); }}><LogOut size={17}/>Déconnexion</button></header>

    <section className={`driver-subscription-status ${active ? "is-active" : "is-expired"}`}><Wallet size={23}/><div><strong>{active ? "Abonnement actif" : "Abonnement expiré ou inactif"}</strong><span>{formatExpiry(profile)}</span></div><Link href="/espace-livreur/paiement">{active ? "Gérer" : "Activer"}</Link></section>

    <section className={`driver-availability ${available ? "is-available" : ""}`}><div><Power size={24}/><strong>{available ? "Vous êtes disponible" : "Vous êtes indisponible"}</strong><span>{!verified ? "Validation administrative en attente" : !active ? "Un abonnement actif est requis" : available ? "Vous pouvez recevoir de nouvelles demandes" : "Vous n’apparaissez pas dans le fil des restaurants"}</span></div><button onClick={toggleAvailability} disabled={!verified || !active}>{available ? "Passer indisponible" : "Devenir disponible"}</button></section>
    {notice && <p className="settings-notice">{notice}</p>}
    {!verified && <section className="driver-status-notice"><strong>Votre compte est en attente de validation</strong><span>La pièce d’identité doit être vérifiée avant l’accès aux courses.</span></section>}

    <section className="driver-requests"><Clock3 size={28}/><h2>{pendingRequest ? "Demande de course" : "Aucune demande en attente"}</h2>{pendingRequest ? <><p>{pendingRequest.restaurant} · {pendingRequest.route}</p><div className="driver-request-actions"><button className="accept" onClick={() => respondToRequest("accept")}><Check size={15}/>Accepter</button><button className="decline" onClick={() => respondToRequest("decline")}><X size={15}/>Refuser</button></div></> : <p>Les demandes des restaurants apparaîtront ici lorsque vous serez disponible.</p>}</section>

    <section className="driver-rules"><div className="driver-rules-heading"><Info size={20}/><div><p className="eyebrow">RÈGLES DE LIVRAISON</p><h2>Les bons réflexes</h2></div></div><div className="driver-rules-grid"><article><QrCode size={19}/><strong>Scanner la commande</strong><p>Ouvrez le Scanner et lisez le QR Miamgo au retrait ou à la remise de la commande.</p></article><article><Bike size={19}/><strong>Retrait ou livraison</strong><p>Vérifiez le mode prévu : retrait client au restaurant ou livraison à l’adresse indiquée.</p></article><article><Check size={19}/><strong>Valider avec le code</strong><p>Ne validez qu’après remise effective. Le code de validation confirme la livraison.</p></article></div></section>
  </main></PlatformShell>;
}
