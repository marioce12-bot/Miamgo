"use client";

import Link from "next/link";
import { ArrowLeft, Bike, MapPin, MessageCircle, Star } from "lucide-react";
import PlatformShell from "../../components/PlatformShell";

const drivers = [["Koffi Mensah", "KM", "4.9", "1,2 km", "12", "#d96b3a"], ["Sonia Agossou", "SA", "5.0", "2,1 km", "9", "#586dbe"], ["Moussa Traoré", "MT", "4.8", "2,8 km", "21", "#2d6955"]];
export default function PartnerDrivers() { return <PlatformShell><main className="content-wrap partner-drivers"><Link className="back-link" href="/livreurs"><ArrowLeft size={17} />Retour à mes livreurs</Link><p className="eyebrow">RÉSEAU MIAMGO</p><h1>Livreurs partenaires disponibles</h1><p>Choisissez un livreur pour une course ponctuelle.</p><div className="partner-driver-grid">{drivers.map(([name, initials, rating, distance, trips, color]) => <article key={name}><span style={{ background: color }}>{initials}</span><div><h2>{name}</h2><p><Star size={13} fill="currentColor" />{rating} · {trips} courses · <MapPin size={13} />{distance}</p><small>Disponible maintenant</small></div><button onClick={() => alert(`Demande de course envoyée à ${name}.`)}><Bike size={16} />Envoyer une course</button><a href="https://wa.me/22900000000" target="_blank"><MessageCircle size={16} />WhatsApp</a></article>)}</div></main></PlatformShell> }
