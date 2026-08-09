"use client";

import { useEffect } from "react";
import { usePreferences } from "./PreferencesProvider";

const english = {
  "Accueil": "Home", "Explorer": "Explore", "Panier": "Cart", "Commandes": "Orders", "Profil": "Profile", "Fil Miamgo": "Miamgo Feed", "Tableau de bord": "Dashboard", "Tableau": "Dashboard", "Menu": "Menu", "Livraison": "Delivery", "Plus": "More", "Historique": "History", "Chiffre d'affaires": "Revenue", "Scanner": "Scan", "Déconnexion": "Log out", "Paramètres": "Settings", "Enregistrer": "Save", "Autour de vous": "Around you", "Qu'est-ce qui vous fait envie?": "What are you craving?", "Filtrer": "Filter", "Rechercher un plat, un restaurant...": "Search for a dish or restaurant...", "Se connecter": "Sign in", "S'inscrire": "Sign up", "Créer un compte client": "Create a customer account", "Créer un compte restaurant": "Create a restaurant account", "Créer un compte livreur": "Create a driver account", "Je suis client": "I am a customer", "Je suis restaurant": "I am a restaurant", "Je suis livreur": "I am a driver", "Retour": "Back", "Voir le menu": "View menu", "Voir le restaurant": "View restaurant", "Voir comme un client": "View as customer", "Ajouter un plat": "Add a dish", "Ajouter au panier": "Add to cart", "Mon panier": "My cart", "Votre panier est vide": "Your cart is empty", "Passer la commande": "Place order", "Créer la commande": "Create order", "Payer avec FedaPay": "Pay with FedaPay", "Se faire livrer": "Get delivery", "Retrait sur place": "Pickup", "Pour moi": "For me", "Pour quelqu'un d'autre": "For someone else", "Utiliser ma position réelle": "Use my real location", "Commande programmée": "Scheduled order", "Aucune commande": "No orders", "Aucune donnée disponible": "No data available", "Disponible": "Available", "Indisponible": "Unavailable", "Vous êtes disponible": "You are available", "Vous êtes indisponible": "You are unavailable", "Abonnement requis": "Subscription required", "Validation administrative en attente": "Administrative validation pending", "Restaurants affiliés": "Affiliated restaurants", "Aucune course en cours": "No active delivery", "Historique des courses": "Delivery history", "Mon profil": "My profile", "Compte restaurant": "Restaurant account", "Compte livreur": "Driver account", "Compte client": "Customer account", "Statistiques": "Statistics", "Publications": "Posts", "Profil boutique": "Store profile", "Abonnement": "Subscription", "Utilisateurs": "Users", "Restaurants": "Restaurants", "Livreurs": "Drivers", "Modération": "Moderation", "Actualiser": "Refresh", "Accéder": "Access", "Envoyer": "Send", "Répondre": "Reply", "Aucune demande pour le moment": "No request at the moment", "Les restaurants peuvent vous proposer des courses": "Restaurants can send you delivery requests", "Photo de profil": "Profile photo", "Image de couverture": "Cover image", "Nom complet": "Full name", "Numéro de téléphone": "Phone number", "Adresse e-mail": "Email address", "Mot de passe": "Password", "Ville": "City", "Pays": "Country", "Langue": "Language", "Thème": "Theme", "Clair": "Light", "Sombre": "Dark", "Bénin": "Benin", "Côte d'Ivoire": "Ivory Coast", "Ghana": "Ghana", "Sénégal": "Senegal", "Togo": "Togo"
};

function translate(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = []; let node;
  while ((node = walker.nextNode())) nodes.push(node);
  nodes.forEach((textNode) => { const value = textNode.nodeValue.trim(); if (!value || !english[value]) return; textNode.nodeValue = textNode.nodeValue.replace(value, english[value]); });
  root.querySelectorAll("input[placeholder], textarea[placeholder], [aria-label]").forEach((element) => { ["placeholder", "aria-label"].forEach((attribute) => { const value = element.getAttribute(attribute); if (value && english[value]) element.setAttribute(attribute, english[value]); }); });
}

export default function LocaleDomTranslator() {
  const { language } = usePreferences();
  useEffect(() => { if (language !== "en") return undefined; const apply = () => translate(document.body); apply(); const observer = new MutationObserver(apply); observer.observe(document.body, { childList: true, subtree: true }); return () => observer.disconnect(); }, [language]);
  return null;
}
