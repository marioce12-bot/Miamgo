"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImagePlus, LockKeyhole, Send } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import PlatformShell from "../../../components/PlatformShell";
import { auth } from "../../../lib/firebase";
import { createRestaurantPost, getOwnedRestaurant } from "../../../lib/firestore";
import { uploadImageFile } from "../../../lib/storage";

export default function PublishPost() {
  const [imageFile, setImageFile] = useState(null); const [preview, setPreview] = useState(""); const [restaurant, setRestaurant] = useState(null); const [user, setUser] = useState(null); const [status, setStatus] = useState(""); const [loading, setLoading] = useState(false);
  useEffect(() => onAuthStateChanged(auth, async (session) => { setUser(session); if (session) setRestaurant(await getOwnedRestaurant(session.uid).catch(() => null)); }), []);
  function chooseImage(event) { const file = event.target.files?.[0]; setImageFile(file || null); setPreview(file ? URL.createObjectURL(file) : ""); }
  async function publish(event) { event.preventDefault(); if (!restaurant || restaurant.subscriptionStatus !== "active") { setStatus("L'activation de votre abonnement est obligatoire avant de publier une publicité."); return; } if (!imageFile || !user) { setStatus("Sélectionnez une image depuis votre appareil."); return; } setLoading(true); const form = new FormData(event.currentTarget); try { const imageUrl = await uploadImageFile(imageFile); await createRestaurantPost(user.uid, restaurant.id, { restaurantName: restaurant.name, text: form.get("text"), dish: form.get("dish"), price: form.get("price"), imageUrl }); setStatus("Publication envoyée dans le fil Miamgo."); event.currentTarget.reset(); setImageFile(null); setPreview(""); } catch (error) { setStatus(error.message || "Impossible de téléverser l'image ou publier."); } finally { setLoading(false); } }
  const subscribed = restaurant?.subscriptionStatus === "active";
  return <PlatformShell><main className="content-wrap publish-page"><Link className="back-link" href="/espace-resto"><ArrowLeft size={17} />Retour au dashboard</Link><p className="eyebrow">FIL MIAMGO</p><h1>Publier une publicité</h1>{!subscribed && <section className="publish-paywall"><LockKeyhole size={21}/><div><strong>Abonnement requis</strong><p>Choisissez et activez un plan avant de publier dans le fil.</p></div><Link href="/espace-resto/plus">Voir l&apos;abonnement</Link></section>}<form onSubmit={publish}><label>Texte de votre publication<textarea name="text" required disabled={!subscribed} placeholder="Ex. Le riz gras au poulet est prêt pour le déjeuner..." /></label><label>Photo de la publication<input type="file" accept="image/*" onChange={chooseImage} required disabled={!subscribed} /></label>{preview && <div className="publish-preview"><img src={preview} alt="Aperçu de publication" /><span><ImagePlus size={18} />Aperçu de votre photo</span></div>}<label>Plat ou promotion mise en avant<input name="dish" required disabled={!subscribed} placeholder="Ex. Riz gras au poulet fumé" /></label><label>Prix<input name="price" required disabled={!subscribed} placeholder="Ex. 2 500 FCFA" /></label><button disabled={!subscribed || loading}><Send size={17} />{loading ? "Téléversement..." : "Publier dans le fil"}</button></form>{status && <p className="settings-notice">{status}</p>}</main></PlatformShell>;
}
