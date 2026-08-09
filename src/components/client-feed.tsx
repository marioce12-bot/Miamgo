"use client";

import Image from "next/image";
import { useDeferredValue, useEffect, useState, type FormEvent } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Dish, Publication, Restaurant } from "@/lib/firestore/models";
import { addPostComment, saveSearchHistory, subscribePostComments, subscribePostLikes, subscribePublications, togglePostLike } from "@/lib/social/publication-service";
import { RoleGuard } from "./role-guard";
import { useAuth } from "./auth-provider";
import { type CartItem, ClientOrders } from "./client-orders";
import styles from "./social.module.css";

type Tab = "feed" | "search" | "orders" | "profile";
const icon = { feed: "⌂", search: "⌕", orders: "◫", profile: "◉" };

export function ClientFeed() {
  return <RoleGuard role="client"><ClientFeedWorkspace /></RoleGuard>;
}

function ClientFeedWorkspace() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<Tab>("feed");
  const [posts, setPosts] = useState<Publication[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const queryValue = useDeferredValue(search.trim().toLowerCase());
  useEffect(() => subscribePublications(setPosts), []);
  useEffect(() => {
    if (!db) return;
    const stopRestaurants = onSnapshot(collection(db, "restaurants"), (snapshot) => setRestaurants(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Restaurant)));
    const stopDishes = onSnapshot(collection(db, "dishes"), (snapshot) => setDishes(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Dish)));
    return () => { stopRestaurants(); stopDishes(); };
  }, []);
  if (!user) return null;
  const history = (profile as (typeof profile & { searchHistory?: string[] }) | null)?.searchHistory ?? [];
  const matchingRestaurants = restaurants.filter((restaurant) => restaurant.name.toLowerCase().includes(queryValue));
  const matchingDishes = dishes.filter((dish) => `${dish.name} ${dish.category}`.toLowerCase().includes(queryValue));
  const rankedPosts = [...posts].sort((a, b) => Number(history.some((item) => a.text.toLowerCase().includes(item))) - Number(history.some((item) => b.text.toLowerCase().includes(item)))).reverse();
  function addToCart(dish: Dish) { setCart((current) => { const item = current.find((entry) => entry.id === dish.id); return item ? current.map((entry) => entry.id === dish.id ? { ...entry, quantity: entry.quantity + 1 } : entry) : [...current, { ...dish, quantity: 1 }]; }); }
  return <main className={styles.clientShell}><header className={styles.topbar}><div className={styles.brand}><Image src="/miamgo-logo.png" alt="MiamGo" width={40} height={40} /><strong>MiamGo</strong></div><button className={styles.location}>Cotonou, Bénin</button><button className={styles.cartTop} onClick={() => setTab("orders")}>Panier {cart.reduce((sum, item) => sum + item.quantity, 0)}</button><button className={styles.avatar}>{profile?.displayName?.slice(0, 1)}</button></header><section className={styles.clientContent}>{tab === "feed" && <Feed posts={rankedPosts} restaurants={restaurants} dishes={dishes} userId={user.uid} onAdd={addToCart} />}{tab === "search" && <SearchPanel query={search} onQuery={setSearch} restaurants={matchingRestaurants} dishes={matchingDishes} history={history} userId={user.uid} onAdd={addToCart} />}{tab === "orders" && <ClientOrders userId={user.uid} name={profile?.displayName ?? "Client"} phone={profile?.phone ?? ""} restaurants={restaurants} cart={cart} onCart={setCart} />}{tab === "profile" && <Placeholder title={profile?.displayName ?? "Votre profil"} text="Vos goûts et interactions permettent de personnaliser le fil." />}</section><nav className={styles.mobileNav}>{(["feed", "search", "orders", "profile"] as Tab[]).map((item) => <button key={item} className={tab === item ? styles.activeNav : ""} onClick={() => setTab(item)}><b>{icon[item]}</b><span>{item === "feed" ? "Fil" : item === "search" ? "Recherche" : item === "orders" ? "Commandes" : "Profil"}</span></button>)}</nav></main>;
}

function Feed({ posts, restaurants, dishes, userId, onAdd }: { posts: Publication[]; restaurants: Restaurant[]; dishes: Dish[]; userId: string; onAdd: (dish: Dish) => void }) {
  return <><section className={styles.hero}><p>F-CLI-01 · Pour vous</p><h1>Un fil qui donne faim.</h1><span>Les nouveautés de vos restaurants et les goûts que vous explorez.</span></section><section className={styles.restaurantStrip}>{restaurants.slice(0, 6).map((restaurant) => <article key={restaurant.id}><div className={styles.restaurantAvatar}>{restaurant.logoUrl ? <Image src={restaurant.logoUrl} alt="" width={56} height={56} unoptimized /> : restaurant.name.slice(0, 1)}</div><strong>{restaurant.name}</strong><small>{restaurant.address}</small></article>)}</section><section className={styles.dishStrip}>{dishes.filter((dish) => dish.available).slice(0, 6).map((dish) => <article key={dish.id}><Image src={dish.photoUrl} alt="" width={120} height={90} unoptimized /><div><b>{dish.name}</b><span>{new Intl.NumberFormat("fr-FR").format(dish.price)} FCFA</span><button onClick={() => onAdd(dish)}>Ajouter</button></div></article>)}</section><section className={styles.feed}>{posts.map((post) => <FeedPost key={post.id} post={post} userId={userId} />)}{!posts.length && <Placeholder title="Le fil se prépare" text="Les publications des restaurants apparaîtront ici en temps réel." />}</section></>;
}

function FeedPost({ post, userId }: { post: Publication; userId: string }) {
  const [likes, setLikes] = useState(0); const [liked, setLiked] = useState(false); const [comments, setComments] = useState<Array<{ id: string; text: string; userId: string }>>([]); const [text, setText] = useState("");
  useEffect(() => subscribePostLikes(post.id, userId, (count, currentLiked) => { setLikes(count); setLiked(currentLiked); }), [post.id, userId]);
  useEffect(() => subscribePostComments(post.id, setComments), [post.id]);
  async function comment(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!text.trim()) return; await addPostComment(post.id, userId, text); setText(""); }
  return <article className={styles.feedPost}><Image src={post.imageUrl} alt="Publication MiamGo" width={760} height={500} unoptimized /><div className={styles.postBody}><div className={styles.postMeta}><span>Nouveauté restaurant</span><small>{post.createdAt?.toDate?.().toLocaleDateString("fr-FR") ?? "Maintenant"}</small></div><p>{post.text}</p><div className={styles.interactions}><button className={liked ? styles.liked : ""} onClick={() => togglePostLike(post.id, userId, liked)}>♥ {likes}</button><span>◌ {comments.length} commentaire(s)</span></div><div className={styles.comments}>{comments.slice(-3).map((comment) => <p key={comment.id}><b>{comment.userId === userId ? "Vous" : "Client"}</b> {comment.text}</p>)}</div><form onSubmit={comment}><input value={text} onChange={(event) => setText(event.target.value)} placeholder="Écrire un commentaire" /><button>Envoyer</button></form></div></article>;
}

function SearchPanel({ query, onQuery, restaurants, dishes, history, userId, onAdd }: { query: string; onQuery: (value: string) => void; restaurants: Restaurant[]; dishes: Dish[]; history: string[]; userId: string; onAdd: (dish: Dish) => void }) {
  const [saved, setSaved] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); await saveSearchHistory(userId, query); setSaved("Recherche ajoutée à vos préférences."); }
  return <section className={styles.searchPanel}><p>F-CLI-04</p><h1>Qu&apos;est-ce qui vous fait envie ?</h1><form onSubmit={submit}><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Rechercher un plat ou un restaurant" /><button>Rechercher</button></form>{saved && <span className={styles.saved}>{saved}</span>}<div className={styles.searchResults}><section><h2>Restaurants</h2>{restaurants.length ? restaurants.map((restaurant) => <article key={restaurant.id}><b>{restaurant.name}</b><span>{restaurant.address}</span></article>) : <p>Aucun restaurant trouvé.</p>}</section><section><h2>Plats</h2>{dishes.length ? dishes.map((dish) => <article key={dish.id}><b>{dish.name}</b><span>{dish.category} · {new Intl.NumberFormat("fr-FR").format(dish.price)} FCFA</span><button onClick={() => onAdd(dish)}>Ajouter au panier</button></article>) : <p>Aucun plat trouvé.</p>}</section></div><section className={styles.recommendations}><p>Vous pourriez aussi aimer</p><h2>{history.length ? history.slice(-3).join(" · ") : "Les plats du jour autour de vous"}</h2><span>Ces suggestions évoluent selon vos recherches et interactions.</span></section></section>;
}

function Placeholder({ title, text }: { title: string; text: string }) { return <section className={styles.placeholder}><h1>{title}</h1><p>{text}</p></section>; }
