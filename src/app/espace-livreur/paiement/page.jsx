"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import Script from "next/script";
import { Check, CreditCard } from "lucide-react";
import PlatformShell from "../../../components/PlatformShell";
import FedaPayCheckout from "../../../components/FedaPayCheckout";
import PayoutSettings from "../../../components/PayoutSettings";
import { auth } from "../../../lib/firebase";
import { subscribeUserProfile } from "../../../lib/firestore";
import { extractFedaPayTransactionId } from "../../../lib/fedapay";

const plan = { name: "Abonnement livreur", amount: 3000, detail: "Accès aux demandes de courses Miamgo pendant 30 jours." };

export default function DriverPayment() {
  const [profile, setProfile] = useState(null);
  const [selected, setSelected] = useState(true);
  const [transactionId, setTransactionId] = useState(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("");
  const paymentRef = useRef(null);

  useEffect(() => { let unsubscribe; const stopAuth = onAuthStateChanged(auth, (user) => { if (user) subscribeUserProfile(user.uid, setProfile).then((stop) => { unsubscribe = stop; }).catch(() => {}); }); return () => { stopAuth?.(); unsubscribe?.(); }; }, []);

  async function pay() {
    if (!selected) return;
    if (!auth.currentUser) { setStatus("Connectez-vous avec votre compte livreur."); return; }
    if (profile?.verificationStatus !== "approved") { setStatus("Votre compte doit être validé par l’administration avant le paiement."); return; }
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch("/api/fedapay/create-driver-subscription", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setTransactionId(String(extractFedaPayTransactionId(payload)));
      setTimeout(() => paymentRef.current?.open().catch((error) => setStatus(error.message)), 50);
    } catch (error) { setStatus(error.message || "Impossible de lancer le paiement."); }
  }

  function complete({ reason, transaction }) {
    if (transaction?.status === "approved") setStatus("Paiement reçu. Votre abonnement sera activé après confirmation FedaPay.");
    else if (reason !== window.FedaPay?.DIALOG_DISMISSED) setStatus("Paiement non confirmé. Vous pouvez réessayer.");
  }

  const expiryTimestamp = profile?.subscriptionExpiresAt;
  const expiryDate = expiryTimestamp?.seconds ? new Date(expiryTimestamp.seconds * 1000) : expiryTimestamp ? new Date(expiryTimestamp) : null;
  const active = profile?.subscriptionStatus === "active" && (!expiryDate || expiryDate.getTime() > Date.now());
  const expiry = profile?.subscriptionExpiresAt?.seconds ? new Date(profile.subscriptionExpiresAt.seconds * 1000).toLocaleDateString("fr-FR") : "Non définie";
  return <><Script src="https://cdn.fedapay.com/checkout.js" strategy="afterInteractive" onLoad={() => setReady(true)} /><PlatformShell><main className="content-wrap payment-page driver-subscription-page"><p className="eyebrow">ABONNEMENT LIVREUR</p><h1>Activez votre accès aux courses.</h1><p className="payment-intro">L’abonnement livreur est indépendant des restaurants. Aucune affiliation n’est nécessaire pour payer.</p>{active && <section className="subscription-current"><Check size={20}/><div><strong>Abonnement actif</strong><p>Échéance : {expiry}</p></div></section>}<section className="driver-plan-card"><button type="button" className={selected ? "selected" : ""} onClick={() => setSelected(true)}><span className="plan-check">{selected && <Check size={16}/>}</span><div><strong>{plan.name}</strong><small>{plan.detail}</small></div><b>{plan.amount.toLocaleString("fr-FR")} FCFA<small>/mois</small></b></button><button className="driver-pay-button" type="button" onClick={pay} disabled={active || !selected}><CreditCard size={17}/>{active ? "Abonnement déjà actif" : "Payer 3 000 FCFA"}</button>{status && <p className="settings-notice">{status}</p>}<FedaPayCheckout ref={paymentRef} transactionId={transactionId} amount={plan.amount} description={plan.name} customer={{ email: auth.currentUser?.email }} ready={ready} onComplete={complete} onError={setStatus}/></section><PayoutSettings collectionName="users" documentId="current-user" title="Bénéficiaire livreur" /></main></PlatformShell></>;
}
