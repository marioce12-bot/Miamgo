"use client";

import Link from "next/link";
import { BarChart3, Bell, ClipboardList, Home, LayoutDashboard, MapPin, PackageCheck, Plus, Store, Truck, UserRound, Wallet } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { getDriverApplication, getOwnedRestaurant, getUserProfile } from "../lib/firestore";

export default function PlatformShell({ children, active = "", publicPage = false }) {
  const pathname = usePathname();
  const router = useRouter();
  const [location, setLocation] = useState({ city: "Cotonou", country: "BJ" });
  const [profileLink, setProfileLink] = useState("/profil");
  const [role, setRole] = useState(null);
  const [roleReady, setRoleReady] = useState(false);
  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) { setRole("client"); setRoleReady(true); return; }
    const profile = await getUserProfile(user.uid).catch(() => null);
    if (profile?.city) setLocation({ city: profile.city, country: profile.country || "BJ" });
    if (profile?.role === "restaurant_owner") setProfileLink("/espace-resto");
    if (profile?.role === "driver") setProfileLink("/espace-livreur");
    const driverApplication = profile?.role === "client" ? await getDriverApplication(user.uid).catch(() => null) : null;
    if (driverApplication) { setProfileLink("/espace-livreur"); setRole("driver"); }
    else if (profile?.role) setRole(profile.role);
    if (profile?.role !== "restaurant_owner" && await getOwnedRestaurant(user.uid).catch(() => null)) { setProfileLink("/espace-resto"); setRole("restaurant_owner"); }
    setRoleReady(true);
  }), []);
  const isRestaurant = role === "restaurant_owner";
  const isDriver = role === "driver";
  const isPublicAuth = pathname === "/connexion" || pathname.startsWith("/inscription-");
  const authType = pathname.includes("inscription-resto") ? "restaurant-auth" : pathname.includes("inscription-livreur") ? "driver-auth" : pathname.includes("inscription-client") ? "client-auth" : "";
  const currentItem = (href) => href === "/accueil" ? pathname === "/accueil" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className={`platform-page ${isRestaurant ? "restaurant-shell" : ""} ${isPublicAuth ? "public-auth-page" : ""} ${authType}`}>
      <header className="portal-header">
        {pathname !== "/" && pathname !== "/accueil" && <button className={`desktop-back ${pathname.startsWith("/restaurant/") ? "restaurant-back" : ""}`} onClick={() => router.replace(isRestaurant ? "/espace-resto" : "/accueil")}>← Retour</button>}
        <Link className="brand brand-with-logo" href="/accueil"><img src="/miamgo-logo.png" alt="Logo Miamgo" /></Link>
        <div className="portal-location"><MapPin size={16} /><span>{location.city}, {location.country}</span></div>
        <div className="portal-actions"><Link className="notification-link" href={profileLink} aria-label="Notifications"><Bell size={19} /><b>2</b></Link><Link href={profileLink}>Mon profil</Link></div>
      </header>
      {isRestaurant && !publicPage && !isPublicAuth && <aside className="restaurant-desktop-nav"><p className="eyebrow">ESPACE RESTAURANT</p>{[["Commandes", "/espace-resto/commandes", PackageCheck], ["Menu", "/espace-resto/menu", Store], ["Livraison", "/espace-resto/livraison", Truck], ["Fil Miamgo", "/accueil", Home], ["Publications", "/espace-resto/publier", ClipboardList], ["Statistiques", "/espace-resto/statistiques", LayoutDashboard], ["Profil boutique", "/espace-resto/profil", UserRound], ["Abonnement", "/espace-resto/abonnement", Bell]].map(([label, href, Icon]) => <Link className={currentItem(href) ? "active" : ""} href={href} key={label}><Icon size={17}/>{label}</Link>)}</aside>}
      {isDriver && !isPublicAuth && <aside className="driver-desktop-nav"><p className="eyebrow">ESPACE LIVREUR</p>{[["Tableau de bord", "/espace-livreur", LayoutDashboard], ["Historique", "/espace-livreur/historique", ClipboardList], ["Chiffre d'affaires", "/espace-livreur/chiffre-affaires", BarChart3], ["Restaurants affiliés", "/espace-livreur/affiliations", Store], ["Abonnement", "/espace-livreur/paiement", Wallet], ["Profil / Paramètres", "/espace-livreur/profil", UserRound]].map(([label, href, Icon]) => <Link className={currentItem(href) ? "active" : ""} href={href} key={label}><Icon size={17}/>{label}</Link>)}<button className="driver-sidebar-logout">Déconnexion</button></aside>}
      <div className={roleReady ? "role-content" : "role-content role-content-loading"}>{children}</div>
      {isRestaurant && (pathname === "/espace-resto/commandes" || pathname === "/espace-resto/menu") && <Link className="restaurant-fab" href={pathname === "/espace-resto/menu" ? "/espace-resto/menu?create=1" : "/espace-resto/publier"}><Plus size={23} /></Link>}
    </div>
  );
}
