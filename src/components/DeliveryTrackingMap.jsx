"use client";

import { useEffect, useState } from "react";
import { MapPin, Radio } from "lucide-react";
import { subscribeDriverLocation } from "../lib/realtimeLocation";

export default function DeliveryTrackingMap({ orderId, driverId, title = "Suivi de livraison" }) {
  const [location, setLocation] = useState(null);
  useEffect(() => { if (!orderId || !driverId) return undefined; return subscribeDriverLocation(orderId, driverId, setLocation); }, [orderId, driverId]);
  const left = location ? `${Math.min(92, Math.max(8, ((location.longitude + 180) / 360) * 100))}%` : "50%";
  const top = location ? `${Math.min(88, Math.max(12, ((90 - location.latitude) / 180) * 100))}%` : "50%";
  return <section className="delivery-tracking-card"><div className="tracking-heading"><div><p className="eyebrow">SUIVI EN DIRECT</p><h2>{title}</h2></div><span className={location ? "tracking-live" : "tracking-waiting"}><Radio size={13}/>{location ? "En direct" : "En attente"}</span></div><div className="tracking-map"><div className="tracking-road road-one"/><div className="tracking-road road-two"/><div className="tracking-marker" style={{ left, top }}><MapPin size={25}/></div><span className="tracking-map-label">Position du livreur</span></div>{location && <small>Dernière position reçue · précision {Math.round(location.accuracy || 0)} m</small>}</section>;
}
