"use client";

import Link from "next/link";
import { BarChart3, ClipboardList, Compass, Home, Menu, PackageCheck, ScanLine, ShoppingBag, Store, Truck, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { getDriverApplication, getOwnedRestaurant, getUserProfile } from "../lib/firestore";
import { usePreferences } from "./PreferencesProvider";

const customerItems = [["Accueil", "/accueil", Home], ["Explorer", "/explorer", Compass], ["Panier", "/panier", ShoppingBag], ["Commandes", "/commandes", ClipboardList], ["Profil", "/profil", UserRound]];
const restaurantItems = [["Fil", "/accueil", Home], ["Commandes", "/espace-resto/commandes", PackageCheck], ["Menu", "/espace-resto/menu", Store], ["Livraison", "/espace-resto/livraison", Truck], ["Profil", "/espace-resto/profil", UserRound]];
const driverItems = [["Tableau de bord", "/espace-livreur", Home], ["Historique", "/espace-livreur/historique", ClipboardList], ["Scanner", "/espace-livreur/scanner?autostart=1", ScanLine], ["Chiffre d'affaires", "/espace-livreur/chiffre-affaires", BarChart3], ["Profil", "/espace-livreur/profil", UserRound]];

export default function MobileRoleNav() {
  const pathname = usePathname();
  const { t } = usePreferences() || { t: (key) => key };
  const [role, setRole] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  useEffect(() => { const sync = () => setCartCount(Number(localStorage.getItem("miamgo-cart-count") || 0)); sync(); window.addEventListener("miamgo-cart-updated", sync); return () => window.removeEventListener("miamgo-cart-updated", sync); }, []);
  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) { setRole("client"); return; }
    const profile = await getUserProfile(user.uid).catch(() => null);
    const driverApplication = profile?.role === "client" ? await getDriverApplication(user.uid).catch(() => null) : null;
    const ownsRestaurant = profile?.role !== "restaurant_owner" && !driverApplication && await getOwnedRestaurant(user.uid).catch(() => null);
    setRole(profile?.role === "driver" || driverApplication ? "driver" : profile?.role === "restaurant_owner" || ownsRestaurant ? "restaurant_owner" : "client");
  }), []);
  const publicPaths = ["/", "/connexion", "/inscription-client", "/inscription-resto", "/inscription-livreur"];
  if (!role || publicPaths.includes(pathname) || pathname.startsWith("/admin")) return null;
  if (typeof document !== "undefined") document.cookie = `miamgo_role=${role}; path=/; max-age=86400; samesite=lax`;
  const items = role === "restaurant_owner" ? restaurantItems.map(([label, href, Icon]) => [label === "Fil" ? t("feed") : label === "Commandes" ? t("orders") : label === "Menu" ? t("menu") : label === "Livraison" ? t("delivery") : t("profile"), href, Icon]) : role === "driver" ? driverItems : customerItems.map(([label, href, Icon]) => [label === "Accueil" ? t("home") : label === "Explorer" ? t("explore") : label === "Panier" ? t("cart") : label === "Commandes" ? t("orders") : t("profile"), href, Icon]);
   const activeDriverIndex = role === "driver" ? driverItems.findIndex(([, href]) => pathname === href.split("?")[0]) : -1;
   const isActive = (href) => {
     const baseHref = href.split("?")[0];
     if (role === "driver") return pathname === baseHref;
     return baseHref === "/accueil" ? pathname === "/accueil" : pathname === baseHref || pathname.startsWith(`${baseHref}/`);
   };
   return <nav aria-label={role === "driver" ? "Navigation livreur" : "Navigation principale"} className={`portal-mobile-nav ${role === "restaurant_owner" ? "restaurant-mobile-nav" : role === "driver" ? "driver-mobile-nav" : ""}`}>{items.map(([label, href, Icon], index) => <Link className={`${role === "driver" ? (index === activeDriverIndex ? "active" : "") : (isActive(href) ? "active" : "")} ${role === "driver" && label === "Scanner" ? "driver-scan-action" : ""}`} href={href} key={label} aria-label={label}><Icon size={role === "driver" && label === "Scanner" ? 26 : 21} />{label === "Panier" && cartCount > 0 && <i>{cartCount}</i>}<span>{label}</span></Link>)}</nav>;
}
