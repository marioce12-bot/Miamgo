"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Check, Crown, X } from "lucide-react";
import PlatformShell from "../../../components/PlatformShell";
import FedaPayCheckout from "../../../components/FedaPayCheckout";
import { auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getOwnedRestaurant } from "../../../lib/firestore";

const plans = [
  ["Basique", 2500, ["Boutique en ligne", "Menu et commandes"]],
  ["Pro", 5000, ["Promotions", "Livreurs internes", "Statistiques"]],
  ["Premium IA", 12000, ["Agent IA", "Recommandations", "Tout le plan Pro"]],
];

export default function SubscriptionPage() {
  const [selected, setSelected] = useState("Pro");
  const [restaurant, setRestaurant] = useState(null);
  const [confirmPlan, setConfirmPlan] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("");
  const [changePlan, setChangePlan] = useState(false);
  const paymentRef = useRef(null);

  useEffect(() => {
    let authStop;
    let restaurantStop;
    authStop = onAuthStateChanged(auth, (user) => {
      if (!user) { setRestaurant(null); return; }
      getOwnedRestaurant(user.uid).then((owned) => {
      setRestaurant(owned);
      if (owned?.plan) setSelected(owned.plan);
      if (owned?.id) import("firebase/firestore").then(({ doc, getFirestore, onSnapshot }) => {
        restaurantStop?.();
        restaurantStop = onSnapshot(doc(getFirestore(), "restaurants", owned.id), (snapshot) => {
          const next = { id: snapshot.id, ...snapshot.data() };
          setRestaurant(next);
          if (next.plan) setSelected(next.plan);
        });
      });
      }).catch(() => setStatus("Impossible de charger votre restaurant. Reconnectez-vous puis réessayez."));
    });
    return () => { authStop?.(); restaurantStop?.(); };
  }, []);

  function selectPlan(name) {
    setSelected(name);
    setStatus("");
    setConfirmPlan(name);
  }

  async function pay(planName) {
    setConfirmPlan(null);
    if (!auth.currentUser || !restaurant) { setStatus("Connectez-vous avec le compte propriétaire du restaurant."); return; }
    setSelected(planName);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch("/api/fedapay/create-subscription", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ restaurantId: restaurant.id, plan: planName }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || payload.details || `FedaPay a refusé la transaction (${response.status}).`);
      const nextTransactionId = payload.transaction?.id || payload.transaction?.data?.id;
      if (!nextTransactionId) throw new Error("FedaPay n’a pas retourné d’identifiant de transaction.");
      setTransactionId(String(nextTransactionId));
      setTimeout(() => paymentRef.current?.open().catch((error) => setStatus(error.message)), 50);
    } catch (error) { setStatus(error.message || "Impossible de lancer le paiement."); }
  }

  function complete({ reason, transaction }) {
    if (transaction?.status === "approved") setStatus("Paiement reçu. L’abonnement sera activé automatiquement.");
    else if (reason !== window.FedaPay?.DIALOG_DISMISSED) setStatus("Paiement non confirmé. Vous pouvez réessayer.");
  }

  const active = restaurant?.subscriptionStatus === "active";
  const expiry = restaurant?.subscriptionExpiresAt?.seconds ? new Date(restaurant.subscriptionExpiresAt.seconds * 1000).toLocaleDateString("fr-FR") : "Non défini";
  const confirmedPlan = plans.find(([name]) => name === confirmPlan);

  return <><Script src="https://cdn.fedapay.com/checkout.js?v=1.1.7" strategy="afterInteractive" onLoad={() => setReady(true)} /><PlatformShell><main className="content-wrap subscription-page"><p className="eyebrow">ABONNEMENT</p><h1>Votre plan restaurant</h1><section className={`subscription-current ${active ? "subscription-active" : ""}`}><Crown size={25}/><div><strong>{active ? `Abonnement ${restaurant.plan} actif` : `Plan sélectionné : ${restaurant?.plan || selected}`}</strong><p>{active ? `Échéance : ${expiry}` : "Aucun paiement n’est prélevé avant l’activation."}</p></div></section>{active && !changePlan ? <button className="change-plan-button" onClick={() => setChangePlan(true)}>Changer de plan</button> : <><div className="plan-cards">{plans.map(([name, price, features]) => <button type="button" className={`plan-card ${selected === name ? "selected" : ""}`} onClick={() => selectPlan(name)} aria-pressed={selected === name} key={name}><span className="plan-card-top"><span className="plan-radio">{selected === name && <Check size={14}/>}</span><span><strong>{name}</strong><small>Formule mensuelle</small></span></span><span className="plan-price">{price.toLocaleString("fr-FR")} FCFA<small>/mois</small></span><span className="plan-features">{features.map((feature) => <span key={feature}><Check size={14}/>{feature}</span>)}</span><span className="plan-card-cta">Choisir cette formule</span></button>)}</div>{active && <button className="change-plan-button" onClick={() => setChangePlan(false)}>Annuler le changement</button>}</>}{status && <p className="settings-notice">{status}</p>}<FedaPayCheckout ref={paymentRef} transactionId={transactionId} amount={plans.find((plan) => plan[0] === selected)?.[1]} description={`Abonnement Miamgo ${selected}`} customer={auth.currentUser} ready={ready} onComplete={complete} onError={setStatus}/>{confirmPlan && confirmedPlan && <div className="subscription-modal-backdrop" role="presentation"><section className="subscription-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-plan-title"><button className="subscription-modal-close" type="button" onClick={() => setConfirmPlan(null)} aria-label="Fermer"><X size={18}/></button><p className="eyebrow">CONFIRMATION</p><h2 id="confirm-plan-title">Activer la formule {confirmedPlan[0]} ?</h2><p>Vous allez lancer le paiement de <strong>{confirmedPlan[1].toLocaleString("fr-FR")} FCFA par mois</strong> avec FedaPay.</p><div className="subscription-modal-actions"><button type="button" className="subscription-cancel" onClick={() => setConfirmPlan(null)}>Annuler</button><button type="button" className="subscription-confirm" disabled={!ready} onClick={() => pay(confirmedPlan[0])}>{ready ? "Confirmer et payer" : "Chargement du paiement..."}</button></div></section></div>}</main></PlatformShell></>;
}
