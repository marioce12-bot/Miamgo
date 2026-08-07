"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, CreditCard, LocateFixed, MapPin, ShoppingBag, Store, Truck } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import PlatformShell from "../../components/PlatformShell";
import { auth } from "../../lib/firebase";
import { createOrder, ensureCustomerProfile } from "../../lib/firestore";

export default function CheckoutPage() {
  const [delivery, setDelivery] = useState("delivery");
  const [recipient, setRecipient] = useState("me");
  const [user, setUser] = useState(null);
  const [orderStatus, setOrderStatus] = useState("");
  const [selfAddress, setSelfAddress] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientArea, setRecipientArea] = useState("");
  useEffect(() => onAuthStateChanged(auth, (session) => { setUser(session); if (session) ensureCustomerProfile(session).catch(console.error); }), []);
  async function beginOrder() {
    if (!user) { setOrderStatus("Connectez-vous depuis le fil Miamgo avant de confirmer votre commande."); return; }
    if (delivery === "delivery" && recipient === "me" && !selfAddress.trim()) { setOrderStatus("Ajoutez votre adresse ou utilisez votre position pour continuer."); return; }
    if (delivery === "delivery" && recipient === "other" && (!recipientPhone.trim() || !recipientArea.trim())) { setOrderStatus("Indiquez le téléphone et le quartier du destinataire."); return; }
    setOrderStatus("Création de votre commande...");
    try {
      const deliveryDetails = recipient === "other" ? { recipientType: "other", recipientPhone, recipientArea } : { recipientType: "self", address: selfAddress };
      const order = await createOrder(user.uid, { restaurantId: "chez-aicha", restaurantName: "Chez Aïcha", fulfillmentType: delivery, deliveryDetails, items: [{ id: "riz-gras-poulet", name: "Riz gras au poulet fumé", price: 2500, quantity: 1 }, { id: "bissap", name: "Jus de bissap maison", price: 500, quantity: 1 }], amount: 3000, currency: "XOF" });
      setOrderStatus(`Commande ${order.serialNumber} créée. Le paiement FedaPay sera ajouté à l'étape suivante.`);
    } catch { setOrderStatus("Impossible de créer la commande. Vérifiez que Firestore est activé."); }
  }
  return <PlatformShell><main className="checkout-page"><Link className="back-link" href="/panier"><ChevronLeft size={18} />Retour au panier</Link><div className="checkout-title"><p className="eyebrow">FINALISER VOTRE COMMANDE</p><h1>Comment souhaitez-vous recevoir votre repas?</h1><span>Étape 1 sur 2</span></div><div className="checkout-layout"><section className="checkout-form"><h2>Mode de réception</h2><div className="delivery-options"><button className={delivery === "delivery" ? "selected" : ""} onClick={() => setDelivery("delivery")}><Truck size={23} /><div><strong>Se faire livrer</strong><span>À l&apos;adresse de votre choix</span></div>{delivery === "delivery" && <Check size={17} />}</button><button className={delivery === "pickup" ? "selected" : ""} onClick={() => setDelivery("pickup")}><Store size={23} /><div><strong>Retrait sur place</strong><span>Récupérez votre commande chez Aïcha</span></div>{delivery === "pickup" && <Check size={17} />}</button></div>{delivery === "delivery" && <><h2 className="form-section-title">Pour qui est cette commande?</h2><div className="recipient-options"><button className={recipient === "me" ? "selected" : ""} onClick={() => setRecipient("me")}>Pour moi</button><button className={recipient === "other" ? "selected" : ""} onClick={() => setRecipient("other")}>Pour quelqu&apos;un d&apos;autre</button></div>{recipient === "me" ? <div className="delivery-fields"><label>Votre adresse de livraison<input value={selfAddress} onChange={(event) => setSelfAddress(event.target.value)} placeholder="Quartier, rue, repère" /></label><button className="use-location" onClick={() => setSelfAddress("Position actuelle détectée")}> <LocateFixed size={16} />Utiliser ma position</button></div> : <div className="delivery-fields"><p className="recipient-help"><MapPin size={16} />La géolocalisation n&apos;est pas demandée pour un proche: son téléphone et son quartier suffisent.</p><label>Numéro du destinataire<input value={recipientPhone} onChange={(event) => setRecipientPhone(event.target.value)} placeholder="+229 00 00 00 00" /></label><label>Quartier de livraison<input value={recipientArea} onChange={(event) => setRecipientArea(event.target.value)} placeholder="Ex. Fidjrossè, près de la pharmacie" /></label></div>}</>}<h2 className="form-section-title">Moyen de paiement</h2><button className="payment-option selected"><CreditCard size={21} /><div><strong>Paiement bientôt disponible</strong><span>FedaPay sera raccordé une fois le site finalisé.</span></div><Check size={17} /></button></section><aside className="checkout-summary"><div><span>Chez Aïcha</span><b>2 articles</b></div><p>Riz gras au poulet fumé <strong>2 500 FCFA</strong></p><p>Jus de bissap maison <strong>500 FCFA</strong></p><hr /><p>Sous-total <strong>3 000 FCFA</strong></p><p>Livraison <strong>{delivery === "delivery" ? "À calculer" : "0 FCFA"}</strong></p><div className="checkout-total"><span>Total à payer</span><strong>3 000 FCFA</strong></div><button onClick={beginOrder}><ShoppingBag size={18} />Créer la commande</button><small>Le paiement sera intégré avec FedaPay après finalisation du site.</small>{orderStatus && <p className="checkout-status">{orderStatus}</p>}</aside></div></main></PlatformShell>;
}
