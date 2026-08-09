"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { updateProfileSettings } from "../lib/firestore";

const translations = {
  fr: { settings: "Paramètres", save: "Enregistrer", logout: "Déconnexion", home: "Accueil", explore: "Explorer", cart: "Panier", orders: "Commandes", profile: "Profil", available: "Disponible", unavailable: "Indisponible", language: "Langue", theme: "Thème", light: "Clair", dark: "Sombre", reply: "Répondre", send: "Envoyer" },
  en: { settings: "Settings", save: "Save", logout: "Log out", home: "Home", explore: "Explore", cart: "Cart", orders: "Orders", profile: "Profile", available: "Available", unavailable: "Unavailable", language: "Language", theme: "Theme", light: "Light", dark: "Dark", reply: "Reply", send: "Send" },
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
