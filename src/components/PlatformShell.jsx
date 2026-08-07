"use client";

import Link from "next/link";
import { Bell, ClipboardList, Home, LayoutDashboard, MapPin, PackageCheck, Plus, Store, Truck, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { getOwnedRestaurant, getUserProfile } from "../lib/firestore";
import MobileRoleNav from "./MobileRoleNav";

export default function PlatformShell({ children, active = "" }) {
  const pathname = usePathname();
  const router = useRouter();
  const [location, setLocation] = useState({ city: "Cotonou", country: "BJ" });
  const [profileLink, setProfileLink] = useState("/profil");
  const [role, setRole] = useState("client");
  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    const profile = await getUserProfile(user.uid).catch(() => null);
    if (profile?.city) setLocation({ city: profile.city, country: profile.country || "BJ" });
    if (profile?.role === "restaurant_owner") setProfileLink("/espace-resto");
    if (profile?.role === "driver") setProfileLink("/espace-livreur");
    if (profile?.role) setRole(profile.role);
    if (profile?.role !== "restaurant_owner" && await getOwnedRestaurant(user.uid).catch(() => null)) { setProfileLink("/espace-resto"); setRole("restaurant_owner"); }
  }), []);
  const isRestaurant = role === "restaurant_owner";
  const currentItem = (href) => href === "/accueil" ? pathname === "/accueil" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="platform-page">
      <header className="portal-header">
        {pathname !== "/" && pathname !== "/accueil" && <button className="desktop-back" onClick={() => router.back()}>← Retour</button>}
        <Link className="brand brand-with-logo" href="/accueil"><img src="/miamgo-logo.png" alt="Logo Miamgo" /></Link>
        <div className="portal-location"><MapPin size={16} /><span>{location.city}, {location.country}</span></div>
        <div className="portal-actions"><Link className="notification-link" href={profileLink} aria-label="Notifications"><Bell size={19} /><b>2</b></Link><Link href={profileLink}>Mon profil</Link></div>
      </header>
      {isRestaurant && <aside className="restaurant-desktop-nav"><p className="eyebrow">ESPACE RESTAURANT</p>{[["Commandes", "/espace-resto/commandes", PackageCheck], ["Menu", "/espace-resto/menu", Store], ["Livraison", "/espace-resto/livraison", Truck], ["Fil Miamgo", "/accueil", Home], ["Publications", "/espace-resto/publier", ClipboardList], ["Statistiques", "/espace-resto/plus", LayoutDashboard], ["Profil boutique", "/espace-resto/profil", UserRound], ["Abonnement", "/espace-resto/plus", Bell]].map(([label, href, Icon]) => <Link className={currentItem(href) ? "active" : ""} href={href} key={label}><Icon size={17}/>{label}</Link>)}</aside>}
      {children}
      <MobileRoleNav />
      {isRestaurant && (pathname === "/espace-resto/commandes" || pathname === "/espace-resto/menu") && <Link className="restaurant-fab" href={pathname === "/espace-resto/menu" ? "/espace-resto/menu?create=1" : "/espace-resto/publier"}><Plus size={23} /></Link>}
    </div>
  );
}
