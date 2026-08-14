"use client";

import { useEffect, useState } from "react";
import { Edit3, ImagePlus, LockKeyhole, Plus, Trash2 } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import PlatformShell from "../../../components/PlatformShell";
import { auth } from "../../../lib/firebase";
import { addRestaurantMenuItem, deleteRestaurantMenuItem, getOwnedRestaurant, getRestaurantMenu, updateRestaurantMenuItem } from "../../../lib/firestore";
import { deleteMediaAsset, uploadImageAsset } from "../../../lib/storage";

const categories = ["Plats du jour", "Grillades", "Boissons", "Cocktails", "Promotions"];

export default function RestaurantMenu() {
  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState("Tous les plats");
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let active = true;
    const stop = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const owned = await getOwnedRestaurant(user.uid).catch(() => null);
      if (!active || !owned) return;
      setRestaurant(owned);
      setItems(await getRestaurantMenu(owned.id).catch(() => []));
    });
    return () => { active = false; stop(); };
  }, []);

  async function save(event) {
    event.preventDefault();
    if (restaurant?.subscriptionStatus !== "active") { setStatus("Un abonnement actif est nécessaire pour gérer le menu."); return; }
    const form = event.currentTarget;
    const data = new FormData(form);
    setUploading(true); setStatus("");
    try {
      const file = data.get("image");
      const asset = file?.size ? await uploadImageAsset(file) : null;
      const values = { name: data.get("name"), price: data.get("price"), category: data.get("category"), imageUrl: asset?.url || editing?.imageUrl || null, imagePublicId: asset?.publicId || editing?.imagePublicId || null, imageResourceType: asset?.mediaType || editing?.imageResourceType || "image" };
      if (editing) {
        await updateRestaurantMenuItem(restaurant.id, editing.id, values);
        if (asset?.publicId && (editing.imagePublicId || editing.imageUrl) && editing.imagePublicId !== asset.publicId) await deleteMediaAsset({ restaurantId: restaurant.id, menuItemId: editing.id, publicId: editing.imagePublicId || editing.imageUrl, resourceType: editing.imageResourceType || "image" }).catch(() => null);
        setItems((current) => current.map((item) => item.id === editing.id ? { ...item, ...values } : item));
      } else {
        const created = await addRestaurantMenuItem(restaurant.id, values);
        setItems((current) => [{ id: created.id, ...values }, ...current]);
      }
      setAdding(false); setEditing(null); form.reset();
    } catch (error) { setStatus(error.message || "Impossible d’enregistrer le plat."); } finally { setUploading(false); }
  }

  async function remove(item) {
    if (!window.confirm(`Supprimer « ${item.name} » du menu ?`)) return;
    try {
      if (item.imagePublicId || item.imageUrl) await deleteMediaAsset({ restaurantId: restaurant.id, menuItemId: item.id, publicId: item.imagePublicId || item.imageUrl, resourceType: item.imageResourceType || "image" }).catch(() => null);
      await deleteRestaurantMenuItem(restaurant.id, item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch (error) { setStatus(error.message || "Impossible de supprimer le plat."); }
  }

  const visible = category === "Tous les plats" ? items : items.filter((item) => item.category === category);
  return <PlatformShell><main className="content-wrap restaurant-menu-page"><div className="restaurant-menu-page-heading"><div><p className="eyebrow">CATALOGUE</p><h1>Votre menu</h1><p>Présentez vos plats et gardez votre carte à jour.</p></div><button className="dashboard-primary-action" type="button" onClick={() => { setEditing(null); setAdding(true); }}><Plus size={17} />Ajouter un plat</button></div>{status && <p className="settings-notice">{status}</p>}<div className="menu-category-tabs"><button type="button" className={category === "Tous les plats" ? "active" : ""} onClick={() => setCategory("Tous les plats")}>Tous les plats</button>{categories.map((item) => <button type="button" className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div>{visible.length ? <section className="restaurant-menu-admin-list">{visible.map((item) => <article className="restaurant-menu-admin-card" key={item.id}><div className="restaurant-menu-admin-image" style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : undefined}>{!item.imageUrl && <ImagePlus size={24} />}</div><div><strong>{item.name}</strong><small>{item.category}</small><b>{Number(item.price || 0).toLocaleString("fr-FR")} FCFA</b></div><div className="restaurant-menu-admin-actions"><button type="button" onClick={() => { setEditing(item); setAdding(true); }} aria-label="Modifier"><Edit3 size={16} /></button><button type="button" onClick={() => remove(item)} aria-label="Supprimer"><Trash2 size={16} /></button></div></article>)}</section> : <section className="empty-state"><LockKeyhole size={30} /><h2>Aucun plat dans cette catégorie</h2><p>Ajoutez un premier plat pour compléter votre menu.</p></section>}{adding && <div className="modal-backdrop" role="presentation"><section className="menu-editor-modal" role="dialog" aria-modal="true"><button className="modal-close" type="button" onClick={() => setAdding(false)} aria-label="Fermer">×</button><p className="eyebrow">{editing ? "MODIFIER LE PLAT" : "NOUVEAU PLAT"}</p><h2>{editing ? editing.name : "Ajouter un plat"}</h2><form onSubmit={save}><label>Nom du plat<input name="name" defaultValue={editing?.name || ""} required /></label><label>Prix en FCFA<input name="price" type="number" min="0" defaultValue={editing?.price || ""} required /></label><label>Catégorie<select name="category" defaultValue={editing?.category || categories[0]}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>Image<input name="image" type="file" accept="image/*" /></label><button className="dashboard-primary-action" type="submit" disabled={uploading}>{uploading ? "Enregistrement..." : "Enregistrer le plat"}</button></form></section></div>}</main></PlatformShell>;
}
