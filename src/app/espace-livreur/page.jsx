"use client";

import { useState } from "react";
import Link from "next/link";
import { Bike, CheckCircle2, ChevronRight, MapPin, Navigation, Phone, Power, Wallet } from "lucide-react";
import PlatformShell from "../../components/PlatformShell";

export default function DriverDashboard() {
  const [available, setAvailable] = useState(true);
  const [accepted, setAccepted] = useState(false);
  return <PlatformShell><main className="content-wrap driver-dashboard"><div className="driver-heading"><div><p className="eyebrow">ESPACE LIVREUR</p><h1>Bonjour, Koffi.</h1><p>Gérez vos disponibilités et vos livraisons.</p></div><button className={available ? "available-toggle" : ""} onClick={() => setAvailable(!available)}><Power size={17} />{available ? "Disponible" : "Indisponible"}</button></div><div className="driver-metrics"><article><Bike size={21} /><strong>12</strong><span>Courses ce mois</span></article><article><Wallet size={21} /><strong>24 500 FCFA</strong><span>Revenus estimés</span></article><article><CheckCircle2 size={21} /><strong>4.9</strong><span>Note moyenne</span></article></div><section className="delivery-job"><div className="job-top"><span>Nouvelle course</span><b>À 1,8 km</b></div><div className="job-route"><span>CA</span><div><strong>Chez Aïcha</strong><p>Cadjèhoun · 1 commande prête</p><i /></div><span className="customer-pin"><MapPin size={17} /></span><div><strong>Marie A.</strong><p>Fidjrossè, près de la pharmacie</p></div></div><div className="job-actions">{accepted ? <><button className="start-delivery"><Navigation size={17} />Démarrer la livraison</button><button onClick={() => setAccepted(false)}>Annuler</button></> : <><button className="start-delivery" onClick={() => setAccepted(true)}>Accepter la course</button><button onClick={() => setAccepted(false)}>Refuser</button></>}</div></section><section className="driver-quick"><Link href="/commandes"><CheckCircle2 size={18} />Mes courses terminées <ChevronRight size={16} /></Link><a href="https://wa.me/22900000000" target="_blank"><Phone size={18} />Contacter le restaurant <ChevronRight size={16} /></a></section></main></PlatformShell>;
}
