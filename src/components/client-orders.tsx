"use client";

import dynamic from "next/dynamic";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState, type FormEvent } from "react";
import type { Coordinates, Dish, Order, Restaurant } from "@/lib/firestore/models";
import { deliveryQuote } from "@/lib/delivery/pricing";
import { createClientOrder, subscribeClientOrders } from "@/lib/client/order-service";
import { createPickupQrValue } from "@/lib/restaurant/order-utils";
import styles from "./social.module.css";

const DeliveryMap = dynamic(() => import("./delivery-map").then((module) => module.DeliveryMap), { ssr: false });

export interface CartItem extends Dish { quantity: number; }

export function ClientOrders({ userId, name, phone, restaurants, cart, onCart }: { userId: string; name: string; phone: string; restaurants: Restaurant[]; cart: CartItem[]; onCart: (items: CartItem[]) => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [checkout, setCheckout] = useState(false);
  useEffect(() => subscribeClientOrders(userId, setOrders), [userId]);
  return <section className={styles.ordersClient}><header><p>F-CLI-05 à F-CLI-12</p><h1>Vos commandes</h1></header>{checkout ? <Checkout userId={userId} name={name} phone={phone} restaurants={restaurants} cart={cart} onCart={onCart} onClose={() => setCheckout(false)} /> : <><Cart cart={cart} onCart={onCart} onCheckout={() => setCheckout(true)} /><OrderHistory orders={orders} /></>}</section>;
}

export function Cart({ cart, onCart, onCheckout }: { cart: CartItem[]; onCart: (items: CartItem[]) => void; onCheckout: () => void }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return <section className={styles.cart}><h2>Panier · {cart.reduce((sum, item) => sum + item.quantity, 0)} article(s)</h2>{cart.map((item) => <article key={item.id}><div><b>{item.name}</b><span>{money(item.price)} · {item.category}</span></div><div className={styles.quantity}><button onClick={() => onCart(item.quantity === 1 ? cart.filter((entry) => entry.id !== item.id) : cart.map((entry) => entry.id === item.id ? { ...entry, quantity: entry.quantity - 1 } : entry))}>−</button><b>{item.quantity}</b><button onClick={() => onCart(cart.map((entry) => entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry))}>+</button></div></article>)}{!cart.length && <p className={styles.empty}>Votre panier est encore vide. Ajoutez des plats depuis la recherche.</p>}{cart.length > 0 && <footer><strong>Total plats {money(total)}</strong><button onClick={onCheckout}>Passer la commande</button></footer>}</section>;
}

function Checkout({ userId, name, phone, restaurants, cart, onCart, onClose }: { userId: string; name: string; phone: string; restaurants: Restaurant[]; cart: CartItem[]; onCart: (items: CartItem[]) => void; onClose: () => void }) {
  const [mode, setMode] = useState<"pickup" | "internal" | "external">("pickup");
  const [thirdParty, setThirdParty] = useState(false);
  const [recipientName, setRecipientName] = useState(""); const [recipientPhone, setRecipientPhone] = useState(""); const [address, setAddress] = useState("");
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [message, setMessage] = useState(""); const [submitting, setSubmitting] = useState(false); const [result, setResult] = useState<Order | null>(null);
  const restaurantId = cart[0]?.restaurantId;
  const restaurant = restaurants.find((item) => item.id === restaurantId);
  const sameRestaurant = cart.every((item) => item.restaurantId === restaurantId);
  const allowedModes = restaurant?.deliveryModes ?? ["pickup"];
  const restaurantLocation = restaurant?.location ? { latitude: restaurant.location.latitude, longitude: restaurant.location.longitude } : { latitude: 6.3703, longitude: 2.3912 };
  const quote = location && mode !== "pickup" ? deliveryQuote(restaurantLocation, location, restaurant?.deliveryPricing ?? { basePrice: 500, pricePerKm: 250 }) : null;
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  async function useLocation() { navigator.geolocation?.getCurrentPosition((position) => setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }), () => setMessage("Géolocalisation indisponible. Saisissez l'adresse, puis réessayez.")); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!restaurantId || !sameRestaurant) { setMessage("Une commande doit concerner un seul restaurant."); return; } if (mode !== "pickup" && !location) { setMessage("Autorisez la géolocalisation pour calculer le tarif de livraison."); return; }
    setSubmitting(true); setMessage("");
    try {
      const cash = mode === "external";
      const order = await createClientOrder({ restaurantId, clientId: userId, clientName: name, clientPhone: phone, items: cart.map((item) => ({ dishId: item.id, name: item.name, unitPrice: item.price, quantity: item.quantity })), fulfillmentMode: mode, ...(thirdParty ? { recipient: { name: recipientName, phone: recipientPhone, address } } : {}), ...(location ? { destination: location } : {}), ...(quote ? { distanceKm: quote.distanceKm } : {}), deliveryPrice: quote?.price ?? 0, paymentMethod: cash ? "cash" : "fedapay" });
      if (!cash) {
        const payment = await fetch("/api/payments/fedapay", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ amount: order.total, description: `Commande ${order.serialNumber}`, customer: { email: `${userId}@miamgo.local`, phone_number: { number: phone.replace(/\D/g, ""), country: "bj" } } }) });
        if (!payment.ok) setMessage((await payment.json() as { error?: string }).error ?? "Commande créée, paiement à configurer.");
      }
      setResult(order); onCart([]);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Commande impossible."); }
    finally { setSubmitting(false); }
  }
  if (result) return <section className={styles.orderSuccess}><h2>{result.paymentMethod === "cash" ? "Commande envoyée" : "Commande créée"}</h2><p>{result.paymentMethod === "cash" ? "À régler en espèces à la livraison." : "Finalisez le paiement FedaPay dès que la configuration Vercel est active."}</p><strong>{result.serialNumber}</strong>{result.fulfillmentMode === "pickup" && <div className={styles.qr}><QRCodeSVG value={createPickupQrValue(result.id, result.validationCode)} size={180} /><span>Présentez ce QR au restaurant.</span></div>}<button onClick={onClose}>Voir mes commandes</button></section>;
  return <form className={styles.checkout} onSubmit={submit}><div className={styles.formTitle}><h2>Finaliser la commande</h2><button type="button" onClick={onClose}>Retour</button></div><p>{restaurant?.name ?? "Restaurant"} · {money(subtotal)} de plats</p><div className={styles.modeButtons}>{(["pickup", "internal", "external"] as const).filter((item) => item === "pickup" || allowedModes.includes(item)).map((item) => <button type="button" key={item} className={mode === item ? styles.selectedMode : ""} onClick={() => setMode(item)}>{item === "pickup" ? "Retrait" : item === "internal" ? "Livraison restaurant" : "Livraison partenaire"}</button>)}</div>{mode !== "pickup" && <><button type="button" className={styles.locationButton} onClick={useLocation}>Utiliser ma position</button><label><input type="checkbox" checked={thirdParty} onChange={(event) => setThirdParty(event.target.checked)} /> Livraison à un tiers</label>{thirdParty && <div className={styles.recipient}><input value={recipientName} onChange={(event) => setRecipientName(event.target.value)} placeholder="Nom du destinataire" required /><input value={recipientPhone} onChange={(event) => setRecipientPhone(event.target.value)} placeholder="Téléphone" required /><input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Adresse de livraison" required /></div>}<div className={styles.quote}>{quote ? <><b>{quote.distanceKm} km</b><strong>Livraison {money(quote.price)}</strong></> : "Géolocalisez-vous pour afficher le prix."}</div></>}{message && <p className={styles.message}>{message}</p>}<footer><strong>Total {money(subtotal + (quote?.price ?? 0))}</strong><button disabled={submitting || !cart.length}>{submitting ? "Création..." : mode === "external" ? "Commander, paiement à la livraison" : "Continuer vers FedaPay"}</button></footer></form>;
}

function OrderHistory({ orders }: { orders: Order[] }) { return <section className={styles.history}><h2>Historique & suivi</h2>{orders.map((order) => <article key={order.id}><div><b>{order.serialNumber}</b><span>{order.items.map((item) => `${item.quantity} × ${item.name}`).join(", ")}</span></div><div><strong>{statusLabel(order.status)}</strong><small>{money(order.total)}</small></div>{order.courierLocation && <DeliveryMap courier={order.courierLocation} destination={order.deliveryDestination} />}{order.fulfillmentMode !== "pickup" && !order.deliveryThirdParty && <p>Code de validation : <b>{order.validationCode}</b></p>}</article>)}{!orders.length && <p className={styles.empty}>Aucune commande pour le moment.</p>}</section>; }
function money(value: number) { return `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`; }
function statusLabel(status: Order["status"]) { return ({ pending_payment: "Paiement en attente", paid: "Commande envoyée", accepted: "Course en attente", preparing: "En préparation", ready: "Prête", in_delivery: "En livraison", picked_up: "Retirée", completed: "Terminée", cancelled: "Annulée" })[status]; }
