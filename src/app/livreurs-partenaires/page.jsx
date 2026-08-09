"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bike, MapPin, MessageCircle, Star } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import PlatformShell from "../../components/PlatformShell";
import { auth } from "../../lib/firebase";
import { getDriverGroupsForRestaurant, getOwnedRestaurant } from "../../lib/firestore";

export default function PartnerDrivers() {
  const [groups, setGroups] = useState({ affiliated: [], platform: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) { setLoading(false); return; }
      const restaurant = await getOwnedRestaurant(user.uid).catch(() => null);
      if (!restaurant) { setLoading(false); return; }
      try {
        setGroups(await getDriverGroupsForRestaurant(restaurant.id));
      } finally { setLoading(false); }
    });
  }, []);

  return <PlatformShell><main className="content-wrap partner-drivers"><Link className="back-link" href="/espace-resto/livraison"><ArrowLeft size={17} />Retour à la livraison</Link><p className="eyebrow">LIVREURS DISPONIBLES</p><h1>Choisir un livreur</h1>{loading ? <div className="admin-table-placeholder">Chargement des livreurs...</div> : <><h2 className="driver-group-title">Mes livreurs affiliés ({groups.affiliated.length})</h2><DriverList drivers={groups.affiliated} /><h2 className="driver-group-title">Autres livreurs actifs de la plateforme ({groups.platform.length})</h2><DriverList drivers={groups.platform} /></>}</main></PlatformShell>;
}

function DriverList({ drivers }) {
  if (!drivers.length) return <div className="admin-table-placeholder"><p>Aucun livreur disponible dans ce groupe.</p></div>;
  return <div className="partner-driver-grid">{drivers.map((driver) => <article key={driver.id}><span className="driver-avatar">{driver.displayName?.slice(0, 2).toUpperCase() || "LI"}</span><div><h2>{driver.displayName}</h2><p><Star size={13} fill="currentColor" />Disponible · <MapPin size={13} />{driver.city || "Zone inconnue"}</p></div><button onClick={() => alert(`Demande envoyée à ${driver.displayName}.`)}><Bike size={16} />Envoyer</button><a href={`https://wa.me/${driver.phone || ""}`} target="_blank"><MessageCircle size={16} />WhatsApp</a></article>)}</div>;
}
