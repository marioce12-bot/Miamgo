"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { auth } from "@/lib/firebase";
import type { Publication } from "@/lib/firestore/models";
import { createPublication, subscribePostComments, subscribePostLikes, subscribePublications } from "@/lib/social/publication-service";
import styles from "./social.module.css";

export function RestaurantPosts({ restaurantId }: { restaurantId: string }) {
  const [posts, setPosts] = useState<Publication[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  useEffect(() => subscribePublications((items) => setPosts(items.filter((item) => item.restaurantId === restaurantId))), [restaurantId]);
  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSending(true); setMessage("");
    try {
      const data = new FormData(event.currentTarget);
      const file = data.get("image");
      if (!(file instanceof File) || !file.size) throw new Error("Choisissez une photo pour la publication.");
      const token = await auth?.currentUser?.getIdToken();
      if (!token) throw new Error("Session expirée.");
      const payload = new FormData(); payload.append("file", file);
      const upload = await fetch("/api/images", { method: "POST", headers: { authorization: `Bearer ${token}` }, body: payload });
      const result = await upload.json() as { url?: string; error?: string };
      if (!upload.ok || !result.url) throw new Error(result.error ?? "Upload impossible.");
      await createPublication(restaurantId, result.url, String(data.get("text")));
      event.currentTarget.reset(); setMessage("Publication envoyée dans le fil.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Publication impossible."); }
    finally { setSending(false); }
  }
  return <div className={styles.restaurantPosts}><header><p>F-REST-19</p><h1>Votre actualité</h1><span>Partagez vos nouveautés, plats du jour et promotions dans le fil MiamGo.</span></header><form onSubmit={publish}><textarea name="text" placeholder="Qu'est-ce qui se passe dans votre restaurant ?" rows={4} required /><div><input name="image" type="file" accept="image/*" required /><button disabled={sending}>{sending ? "Publication..." : "Publier"}</button></div>{message && <p className={styles.message}>{message}</p>}</form><div className={styles.restaurantPostGrid}>{posts.map((post) => <RestaurantPostStats key={post.id} post={post} />)}{!posts.length && <p className={styles.empty}>Vos prochaines nouvelles apparaîtront ici.</p>}</div></div>;
}

function RestaurantPostStats({ post }: { post: Publication }) {
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);
  useEffect(() => subscribePostLikes(post.id, "", (count) => setLikes(count)), [post.id]);
  useEffect(() => subscribePostComments(post.id, (items) => setComments(items.length)), [post.id]);
  return <article><Image src={post.imageUrl} alt="Publication restaurant" width={480} height={320} unoptimized /><p>{post.text}</p><footer><span>{likes} j&apos;aime</span><span>{comments} commentaire(s)</span></footer></article>;
}
