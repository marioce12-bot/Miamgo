"use client";

import Link from "next/link";
import { Bell, Compass, Home, MapPin, ShoppingBag, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { getOwnedRestaurant, getUserProfile } from "../lib/firestore";

export default function PlatformShell({ children, active = "" }) {
  const pathname = usePathname();
  const router = useRouter();
  const [location, setLocation] = useState({ city: "Cotonou", country: "BJ" });
  const [profileLink, setProfileLink] = useState("/profil");
  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    const profile = await getUserProfile(user.uid).catch(() => null);
    if (profile?.city) setLocation({ city: profile.city, country: profile.country || "BJ" });
    if (profile?.role === "restaurant_owner") setProfileLink("/espace-resto");
    if (profile?.role === "driver") setProfileLink("/espace-livreur");
    if (profile?.role !== "restaurant_owner" && await getOwnedRestaurant(user.uid).catch(() => null)) setProfileLink("/espace-resto");
  }), []);
  const items = [
    ["Accueil", "/accueil", Home],
    ["Explorer", "/explorer", Compass],
    ["Panier", "/panier", ShoppingBag],
    ["Commandes", "/commandes", UserRound],
  ];

  return (
    <div className="platform-page">
      <header className="portal-header">
        {pathname !== "/" && pathname !== "/accueil" && <button className="desktop-back" onClick={() => router.back()}>← Retour</button>}
        <Link className="brand brand-with-logo" href="/accueil"><img src="/miamgo-logo.png" alt="Logo Miamgo" /></Link>
        <div className="portal-location"><MapPin size={16} /><span>{location.city}, {location.country}</span></div>
        <div className="portal-actions"><Link className="notification-link" href={profileLink} aria-label="Notifications"><Bell size={19} /><b>2</b></Link><Link href={profileLink}>Mon profil</Link></div>
      </header>
      {children}
      <nav className="portal-mobile-nav">
        {items.map(([label, href, Icon]) => <Link className={active === label ? "active" : ""} href={href} key={label}><Icon size={21} /><span>{label}</span></Link>)}
      </nav>
    </div>
  );
}
