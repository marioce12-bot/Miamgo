"use client";

import Link from "next/link";
import { BarChart3, ClipboardList, Compass, Home, Menu, Navigation, PackageCheck, ScanLine, ShoppingBag, Store, Truck, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { getOwnedRestaurant, getUserProfile } from "../lib/firestore";

const customerItems = [["Accueil", "/accueil", Home], ["Explorer", "/explorer", Compass], ["Panier", "/panier", ShoppingBag], ["Commandes", "/commandes", ClipboardList], ["Profil", "/profil", UserRound]];
const restaurantItems = [["Fil", "/accueil", Home], ["Commandes", "/espace-resto/commandes", PackageCheck], ["Menu", "/espace-resto/menu", Store], ["Livraison", "/espace-resto/livraison", Truck], ["Plus", "/espace-resto/plus", Menu]];
const driverItems = [["Accueil", "/espace-livreur", Home], ["En cours", "/espace-livreur/en-cours", Navigation], ["Scanner", "/espace-livreur/scanner", ScanLine], ["Historique", "/espace-livreur/historique", ClipboardList], ["Revenus", "/espace-livreur/chiffre-affaires", BarChart3], ["Profil", "/espace-livreur/profil", UserRound]];

export default function MobileRoleNav() {
  const pathname = usePathname();
  const [role, setRole] = useState(null);
  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) { setRole("client"); return; }
    const profile = await getUserProfile(user.uid).catch(() => null);
    const ownsRestaurant = profile?.role !== "restaurant_owner" && await getOwnedRestaurant(user.uid).catch(() => null);
    setRole(profile?.role === "driver" ? "driver" : profile?.role === "restaurant_owner" || ownsRestaurant ? "restaurant_owner" : "client");
  }), []);
  const publicPaths = ["/", "/connexion", "/inscription-client", "/inscription-resto", "/inscription-livreur"];
  if (!role || publicPaths.includes(pathname)) return null;
  const items = role === "restaurant_owner" ? restaurantItems : role === "driver" ? driverItems : customerItems;
  const isActive = (href) => href === "/accueil" ? pathname === "/accueil" : pathname === href || pathname.startsWith(`${href}/`);
  return <nav className={`portal-mobile-nav ${role === "restaurant_owner" ? "restaurant-mobile-nav" : role === "driver" ? "driver-mobile-nav" : ""}`}>{items.map(([label, href, Icon]) => <Link className={isActive(href) ? "active" : ""} href={href} key={label}><Icon size={21} />{label === "Commandes" && role === "restaurant_owner" && <i>3</i>}<span>{label}</span></Link>)}</nav>;
}
