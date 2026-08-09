"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { updateProfileSettings } from "../lib/firestore";

const translations = {
  fr: { settings: "Paramètres", save: "Enregistrer", logout: "Déconnexion", home: "Accueil", explore: "Explorer", cart: "Panier", orders: "Commandes", profile: "Profil", available: "Disponible", unavailable: "Indisponible", language: "Langue", theme: "Thème", light: "Clair", dark: "Sombre", reply: "Répondre", send: "Envoyer", feed: "Fil Miamgo", nearby: "Autour de vous", craving: "Qu'est-ce qui vous fait envie?", filter: "Filtrer", search: "Rechercher un plat, un restaurant...", restaurant: "Restaurant", menu: "Menu", delivery: "Livraison", more: "Plus", dashboard: "Tableau de bord", history: "Historique", revenue: "Chiffre d'affaires", scan: "Scanner", signIn: "Se connecter", signUp: "S'inscrire", client: "Je suis client", restaurantAccount: "Je suis restaurant", driver: "Je suis livreur", noData: "Aucune donnée disponible" },
  en: { settings: "Settings", save: "Save", logout: "Log out", home: "Home", explore: "Explore", cart: "Cart", orders: "Orders", profile: "Profile", available: "Available", unavailable: "Unavailable", language: "Language", theme: "Theme", light: "Light", dark: "Dark", reply: "Reply", send: "Send", feed: "Miamgo Feed", nearby: "Around you", craving: "What are you craving?", filter: "Filter", search: "Search for a dish or restaurant...", restaurant: "Restaurant", menu: "Menu", delivery: "Delivery", more: "More", dashboard: "Dashboard", history: "History", revenue: "Revenue", scan: "Scan", signIn: "Sign in", signUp: "Sign up", client: "I am a customer", restaurantAccount: "I am a restaurant", driver: "I am a driver", noData: "No data available" },
};
const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
  const [language, setLanguage] = useState("fr"); const [theme, setTheme] = useState("light"); const [userId, setUserId] = useState(null);
  useEffect(() => { const savedLanguage = localStorage.getItem("miamgo-language"); const savedTheme = localStorage.getItem("miamgo-theme"); const systemLanguage = navigator.language?.toLowerCase().startsWith("fr") ? "fr" : "en"; setLanguage(savedLanguage || systemLanguage); setTheme(savedTheme || "light"); return onAuthStateChanged(auth, (user) => setUserId(user?.uid || null)); }, []);
  useEffect(() => { document.documentElement.lang = language; document.documentElement.dataset.theme = theme; localStorage.setItem("miamgo-language", language); localStorage.setItem("miamgo-theme", theme); }, [language, theme]);
  async function changeLanguage(value) { setLanguage(value); if (userId) await updateProfileSettings(userId, { language: value }).catch(() => {}); }
  async function changeTheme(value) { setTheme(value); if (userId) await updateProfileSettings(userId, { theme: value }).catch(() => {}); }
  const value = useMemo(() => ({ language, theme, setLanguage: changeLanguage, setTheme: changeTheme, t: (key) => translations[language][key] || key }), [language, theme, userId]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
export function usePreferences() { return useContext(PreferencesContext); }
