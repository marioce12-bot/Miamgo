"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, CreditCard, MapPin, ShoppingBag, Store, Truck } from "lucide-react";
import PlatformShell from "../../components/PlatformShell";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { auth } from "../../lib/firebase";
import { createOrder, ensureCustomerProfile } from "../../lib/firestore";

export default function CheckoutPage() {
  const [delivery, setDelivery] = useState("delivery");
  const [recipient, setRecipient] = useState("me");
  const [user, setUser] = useState(null);
  const [orderStatus, setOrderStatus] = useState("");
  useEffect(() => onAuthStateChanged(auth, (session) => {
    setUser(session);
    if (session) ensureCustomerProfile(session).catch(console.error);
  }), []);

  async function beginOrder() {
    if (!user) {
      setOrderStatus("Connectez-vous depuis le fil Miamgo avant de confirmer votre commande.");
      return;
    }
    setOrderStatus("Création de votre commande...");
    try {
      const order = await createOrder(user.uid, {
        restaurantId: "chez-aicha",
        restaurantName: "Chez Aïcha",
        fulfillmentType: delivery,
        recipientType: recipient,
        items: [{ id: "riz-gras-poulet", name: "Riz gras au poulet fumé", price: 2500, quantity: 1 }, { id: "bissap", name: "Jus de bissap maison", price: 500, quantity: 1 }],
        amount: 3000,
        currency: "XOF",
      });
      setOrderStatus(`Commande ${order.serialNumber} créée. Le paiement FedaPay sera ajouté à l'étape suivante.`);
    } catch {
      setOrderStatus("Impossible de créer la commande. Vérifiez que Firestore est activé.");
    }
  }
  return <PlatformShell><main className="checkout-page"><Link className="back-link" href="/panier"><ChevronLeft size={18} />Retour au panier</Link><div className="checkout-title"><p className="eyebrow">FINALISER VOTRE COMMANDE</p><h1>Comment souhaitez-vous recevoir votre repas?</h1><span>Étape 1 sur 2</span></div><div className="checkout-layout"><section className="checkout-form"><h2>Mode de réception</h2><div className="delivery-options"><button className={delivery === "delivery" ? "selected" : ""} onClick={() => setDelivery("delivery")}><Truck size={23} /><div><strong>Se faire livrer</strong><span>À l&apos;adresse de votre choix</span></div>{delivery === "delivery" && <Check size={17} />}</button><button className={delivery === "pickup" ? "selected" : ""} onClick={() => setDelivery("pickup")}><Store size={23} /><div><strong>Retrait sur place</strong><span>Récupérez votre commande chez Aïcha</span></div>{delivery === "pickup" && <Check size={17} />}</button></div>{delivery === "delivery" && <><h2 className="form-section-title">Pour qui est cette commande?</h2><div className="recipient-options"><button className={recipient === "me" ? "selected" : ""} onClick={() => setRecipient("me")}>Pour moi</button><button className={recipient === "other" ? "selected" : ""} onClick={() => setRecipient("other")}>Pour quelqu&apos;un d&apos;autre</button></div><div className="address-block"><div className="address-icon"><MapPin size={19} /></div><div><strong>Adresse de livraison</strong><p>Ajoutez l&apos;adresse exacte du destinataire.</p></div><button>Ajouter</button></div></>}<h2 className="form-section-title">Moyen de paiement</h2><button className="payment-option selected"><CreditCard size={21} /><div><strong>Paiement bientôt disponible</strong><span>FedaPay sera raccordé une fois le site finalisé.</span></div><Check size={17} /></button></section><aside className="checkout-summary"><div><span>Chez Aïcha</span><b>2 articles</b></div><p>Riz gras au poulet fumé <strong>2 500 FCFA</strong></p><p>Jus de bissap maison <strong>500 FCFA</strong></p><hr /><p>Sous-total <strong>3 000 FCFA</strong></p><p>Livraison <strong>{delivery === "delivery" ? "À calculer" : "0 FCFA"}</strong></p><div className="checkout-total"><span>Total à payer</span><strong>3 000 FCFA</strong></div><button onClick={beginOrder}><ShoppingBag size={18} />Créer la commande</button><small>Le paiement sera intégré avec FedaPay après finalisation du site.</small>{orderStatus && <p className="checkout-status">{orderStatus}</p>}</aside></div></main></PlatformShell>;
}
