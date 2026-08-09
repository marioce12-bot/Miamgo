"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { Check, ChevronLeft, LocateFixed, MapPin, ShoppingBag, Truck } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import PlatformShell from "../../components/PlatformShell";
import FedaPayCheckout from "../../components/FedaPayCheckout";
import MiamgoQr from "../../components/MiamgoQr";
import { auth } from "../../lib/firebase";
import { createOrder, ensureCustomerProfile } from "../../lib/firestore";

const fallbackItems = [];

export default function CheckoutPage() {
  const router = useRouter();
  const [delivery, setDelivery] = useState("delivery");
  const [items, setItems] = useState(fallbackItems);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [quote, setQuote] = useState(null);
  const [locating, setLocating] = useState(false);
  const [transactionId, setTransactionId] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [orderSerial, setOrderSerial] = useState(null);
  const [showQr, setShowQr] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [fedapayReady, setFedapayReady] = useState(false);
  const [payableAmount, setPayableAmount] = useState(0);
  const paymentRef = useRef(null);
  const foodSubtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0), [items]);
  const deliveryFee = delivery === "pickup" ? 0 : Number(quote?.deliveryFee || 0);

  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem("miamgo-cart") || "null"); if (Array.isArray(saved) && saved.length) setItems(saved); } catch {}
    return onAuthStateChanged(auth, (session) => { setUser(session); if (session) ensureCustomerProfile(session).catch(() => {}); });
  }, []);

  useEffect(() => {
    if (!orderId) return undefined;
    let stop;
    import("firebase/firestore").then(({ doc, getFirestore, onSnapshot }) => { stop = onSnapshot(doc(getFirestore(), "orders", orderId), (snapshot) => { const data = snapshot.data(); if (data?.paymentStatus === "paid") { setPaymentLoading(false); setStatus(`Commande confirmée ! Numéro ${data.serialNumber || orderSerial || orderId}.`); setShowQr(true); } if (data?.paymentStatus === "payment_failed") { setPaymentLoading(false); setStatus("Le paiement a été refusé. Vous pouvez réessayer."); } }); });
    return () => stop?.();
  }, [orderId, orderSerial]);

  async function locate() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const nextCoordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setCoordinates(nextCoordinates);
      try { const response = await fetch("/api/delivery/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restaurantId: "chez-aicha", ...nextCoordinates }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setQuote(data); setStatus(""); } catch (error) { setStatus(error.message); } finally { setLocating(false); }
    }, () => { setStatus("La géolocalisation est obligatoire pour calculer la livraison."); setLocating(false); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
  }

  async function pay() {
    if (!user) { setStatus("Connectez-vous pour passer commande."); return; }
    if (delivery === "delivery" && (!coordinates || !quote)) { setStatus("Indiquez votre position pour calculer la livraison."); return; }
    setPaymentLoading(true); setStatus("");
    try {
      const created = await createOrder(user.uid, { restaurantId: "chez-aicha", items, deliveryMode: delivery === "pickup" ? "pickup" : "delivery", deliveryFee, courierShare: delivery === "delivery" ? Math.floor(deliveryFee * 0.8) : 0, deliveryCoordinates: coordinates, foodSubtotal });
      setOrderId(created.id); setOrderSerial(created.serialNumber);
      const token = await user.getIdToken();
      const response = await fetch("/api/fedapay/create-transaction", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ orderId: created.id }) });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Création de la transaction impossible.");
      setTransactionId(String(payload.transaction?.id || payload.transaction?.data?.id));
      setPayableAmount(Number(payload.breakdown?.total || foodSubtotal + deliveryFee));
      setTimeout(() => paymentRef.current?.open().catch((error) => { setPaymentLoading(false); setStatus(error.message); }), 50);
    } catch (error) { setPaymentLoading(false); setStatus(error.message || "Impossible de lancer le paiement."); }
  }

  return <><Script src="https://cdn.fedapay.com/checkout.js?v=1.1.7" strategy="afterInteractive" onLoad={() => setFedapayReady(true)} /><PlatformShell><main className="content-wrap checkout-page"><Link className="back-link" href="/panier"><ChevronLeft size={17}/>Retour au panier</Link><p className="eyebrow">FINALISER LA COMMANDE</p><h1>Votre commande</h1><section className="checkout-form"><div className="checkout-mode"><button className={delivery === "delivery" ? "selected" : ""} onClick={() => setDelivery("delivery")}><Truck size={18}/>Livraison</button><button className={delivery === "pickup" ? "selected" : ""} onClick={() => setDelivery("pickup")}><ShoppingBag size={18}/>Retrait sur place</button></div>{delivery === "delivery" && <div className="location-box"><MapPin size={18}/><div><strong>Votre adresse de livraison</strong><p>{quote ? `${quote.distanceKm} km · ${quote.deliveryFee.toLocaleString("fr-FR")} FCFA` : "Calculez les frais selon votre position."}</p></div><button onClick={locate} disabled={locating}><LocateFixed size={15}/>{locating ? "Localisation..." : "Utiliser ma position"}</button></div>}<div className="checkout-items">{items.map((item) => <div key={item.id}><span>{item.quantity} × {item.name}</span><strong>{(item.price * item.quantity).toLocaleString("fr-FR")} FCFA</strong></div>)}</div><div className="checkout-total"><span>Sous-total restaurant</span><strong>{foodSubtotal.toLocaleString("fr-FR")} FCFA</strong></div><div className="checkout-total"><span>Livraison</span><strong>{deliveryFee.toLocaleString("fr-FR")} FCFA</strong></div><p className="checkout-fee-note"><Check size={15}/>Les frais de service Miamgo sont offerts sur vos 5 premières commandes. Ils seront calculés au paiement à partir de la 6e.</p><button className="checkout-pay" onClick={pay} disabled={paymentLoading || !fedapayReady}>{paymentLoading ? "Préparation du paiement..." : "Payer avec FedaPay"}</button>{status && <p className="settings-notice">{status}</p>}</section>{showQr && orderId && <section className="order-qr"><h2>Présentez ce QR au restaurant</h2><MiamgoQr value={orderId}/></section>}<FedaPayCheckout ref={paymentRef} transactionId={transactionId} amount={foodSubtotal + deliveryFee} description={`Commande Miamgo ${orderSerial || ""}`} customer={user} ready={fedapayReady} onComplete={({ transaction }) => { if (transaction?.status === "approved") setStatus("Paiement reçu, confirmation en cours."); }} onError={setStatus}/></main></PlatformShell></>;
}
