"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Bookmark,
  ChevronRight,
  CircleUserRound,
  Heart,
  Home as HomeIcon,
  MapPin,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Send,
  ShoppingBag,
  Sparkles,
  Store,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { addCartItem, addComment, ensureCustomerProfile, saveFavorite, setPostLike } from "../lib/firestore";

const posts = [
  {
    id: 1,
    restaurant: "Chez Aïcha",
    handle: "@chezaicha.cotonou",
    time: "Il y a 18 min",
    location: "Cadjèhoun, Cotonou",
    avatar: "CA",
    color: "#f9703e",
    text: "Le déjeuner est servi. Notre riz gras au poulet fumé sort tout juste de la cuisine, avec sa sauce maison.",
    image: "https://i.ibb.co/1z6kV0D/miamgo-riz-gras.jpg",
    dish: "Riz gras au poulet fumé",
    price: "2 500 FCFA",
    likes: 126,
    comments: 14,
    promoted: true,
  },
  {
    id: 2,
    restaurant: "Le Comptoir de Koffi",
    handle: "@comptoirdekoffi",
    time: "Il y a 42 min",
    location: "Akpakpa, Cotonou",
    avatar: "CK",
    color: "#1967d2",
    text: "Aujourd'hui seulement: les spaghetti bolognaise à prix doux. Pensez à réserver avant 13h.",
    image: "https://i.ibb.co/NrghWQX/miamgo-spaghetti.jpg",
    dish: "Spaghetti bolognaise",
    price: "1 800 FCFA",
    likes: 74,
    comments: 9,
  },
  {
    id: 3,
    restaurant: "Mami Grill",
    handle: "@mamigrill",
    time: "Il y a 1 h",
    location: "Fidjrossè, Cotonou",
    avatar: "MG",
    color: "#245d4c",
    text: "Vendredi braisé: poisson entier, alloco et piment vert. Livraison disponible ce soir.",
    image: "https://i.ibb.co/3YyVpjX/miamgo-poisson.jpg",
    dish: "Poisson braisé & alloco",
    price: "3 000 FCFA",
    likes: 218,
    comments: 31,
  },
];

const restaurants = [
  ["La Terrasse", "4.8", "À 1,2 km", "LT", "#d14b41"],
  ["Sawa Kitchen", "4.6", "À 2,4 km", "SK", "#ea9c28"],
  ["Bénin Délices", "4.9", "À 3,1 km", "BD", "#4a7558"],
];

export default function MiamgoFeed() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [liked, setLiked] = useState([]);
  const [saved, setSaved] = useState([]);
  const [cart, setCart] = useState([]);
  const [comments, setComments] = useState({});
  const [commenting, setCommenting] = useState(null);
  const [search, setSearch] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageErrors, setImageErrors] = useState([]);

  useEffect(() => onAuthStateChanged(auth, (session) => {
    setUser(session);
    if (session) ensureCustomerProfile(session).catch(console.error);
  }), []);

  useEffect(() => {
    if (user && pendingAction) {
      const action = pendingAction;
      setPendingAction(null);
      action();
    }
  }, [user, pendingAction]);

  function requireAuth(action) {
    if (user) {
      action();
      return;
    }
    setPendingAction(() => action);
    setShowLogin(true);
  }

  async function handleAuth(event) {
    event.preventDefault();
    setAuthError("");
    setIsSubmitting(true);
    const data = new FormData(event.currentTarget);
    const email = data.get("email");
    const password = data.get("password");
    try {
      if (authMode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setShowLogin(false);
    } catch (error) {
      setAuthError(error.code === "auth/operation-not-allowed" ? "Activez l'authentification E-mail/Mot de passe dans Firebase pour continuer." : "Connexion impossible. Vérifiez vos identifiants ou créez un compte.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleLike(id) {
    const isLiked = !liked.includes(id);
    setLiked((current) => isLiked ? [...current, id] : current.filter((item) => item !== id));
    setPostLike(user.uid, id, isLiked).catch(console.error);
  }

  function toggleSave(id) {
    const isSaved = !saved.includes(id);
    const post = posts.find((item) => item.id === id);
    setSaved((current) => isSaved ? [...current, id] : current.filter((item) => item !== id));
    saveFavorite(user.uid, post.restaurant.toLowerCase().replaceAll(" ", "-"), isSaved).catch(console.error);
  }

  function addToCart(post) {
    setCart((current) => [...current, post]);
    addCartItem(user.uid, post).catch(console.error);
  }

  function submitComment(event, postId) {
    event.preventDefault();
    const text = new FormData(event.currentTarget).get("comment")?.trim();
    if (!text) return;
    setComments((current) => ({ ...current, [postId]: [...(current[postId] || []), text] }));
    addComment(user.uid, postId, text).catch(console.error);
    setCommenting(null);
  }

  const visiblePosts = posts.filter((post) => `${post.restaurant} ${post.dish} ${post.text}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand brand-with-logo" href="#feed" aria-label="Miamgo accueil"><img src="/miamgo-logo.png" alt="Logo Miamgo" /><span>miam</span>go<i>.</i></a>
        <label className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un plat, un resto..." /></label>
        <nav className="desktop-actions">
          <button className="icon-button" onClick={() => router.push("/profil?tab=notifications")}><Bell size={20} /><span className="badge">3</span></button>
          {user ? <button className="profile-button" onClick={() => router.push("/profil")}><CircleUserRound size={22} /> {user.email?.split("@")[0] || "Mon profil"}</button> : <button className="login-button" onClick={() => setShowLogin(true)}>Se connecter</button>}
        </nav>
      </header>

      <div className="layout">
        <aside className="left-sidebar">
          <div className="location-card"><MapPin size={18} /><div><small>Votre position</small><strong>Cotonou, Bénin</strong></div><ChevronRight size={17} /></div>
          <nav className="side-nav">
            <a className="active" href="#feed"><HomeIcon size={20} />Actualités</a>
            <a href="/explorer"><Store size={20} />Restaurants</a>
            <button onClick={() => requireAuth(() => router.push("/panier"))}><ShoppingBag size={20} />Mon panier <b>{cart.length || ""}</b></button>
            <button onClick={() => requireAuth(() => router.push("/profil?tab=favorites"))}><Bookmark size={20} />Mes favoris</button>
          </nav>
          <div className="pro-card"><Sparkles size={21} /><strong>Votre resto sur Miamgo?</strong><p>Partagez vos plats avec les gourmands autour de vous.</p><a href="/inscription-resto">Créer ma boutique</a></div>
        </aside>

        <section className="feed" id="feed">
          <div className="feed-intro"><div><p className="eyebrow">Autour de vous</p><h1>Qu&apos;est-ce qui vous fait envie?</h1></div><button className="filter-button" onClick={() => document.querySelector(".search-box input")?.focus()}><Menu size={18} /> Filtrer</button></div>
          <div className="story-row">
            <button className="story create-story" onClick={() => requireAuth(() => router.push("/inscription-resto"))}><span><Plus size={20} /></span><small>Partager une envie</small></button>
            {restaurants.map(([name, rating, distance, initials, color]) => <button className="story" key={name} onClick={() => router.push("/explorer")}><span style={{ backgroundColor: color }}>{initials}</span><small>{name}</small><em>{rating} · {distance}</em></button>)}
          </div>

          {visiblePosts.map((post) => {
            const isLiked = liked.includes(post.id);
            const isSaved = saved.includes(post.id);
            const postComments = comments[post.id] || [];
            const broken = imageErrors.includes(post.id);
            return <article className="post-card" key={post.id}>
              {post.promoted && <div className="sponsored"><Sparkles size={14} /> En ce moment près de vous</div>}
              <div className="post-head"><span className="restaurant-avatar" style={{ backgroundColor: post.color }}>{post.avatar}</span><div><strong>{post.restaurant}</strong><p>{post.handle} <span>·</span> {post.time}</p><small><MapPin size={12} />{post.location}</small></div><button className="more" onClick={() => navigator.share?.({ title: post.dish, text: post.text }).catch(() => {})}>•••</button></div>
              <p className="post-copy">{post.text}</p>
              <div className={`food-image ${broken ? "image-fallback" : ""}`} style={broken ? { background: `linear-gradient(135deg, ${post.color}, #ffc66b)` } : undefined}>
                {!broken && <img src={post.image} alt={post.dish} onError={() => setImageErrors((current) => [...current, post.id])} />}
                {broken && <div><UtensilsCrossed size={42} /><strong>{post.dish}</strong><span>Une belle assiette vous attend</span></div>}
                <span className="dish-label">{post.dish}<b>{post.price}</b></span>
              </div>
              <div className="post-meta"><span>{post.likes + (isLiked ? 1 : 0)} j&apos;aime</span><span>{post.comments + postComments.length} commentaires</span></div>
              <div className="post-actions">
                <button className={isLiked ? "liked" : ""} onClick={() => requireAuth(() => toggleLike(post.id))}><Heart size={20} fill={isLiked ? "currentColor" : "none"} />J&apos;aime</button>
                <button onClick={() => requireAuth(() => setCommenting(post.id))}><MessageCircle size={20} />Commenter</button>
                <button className={isSaved ? "saved" : ""} onClick={() => requireAuth(() => toggleSave(post.id))}><Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />Sauvegarder</button>
              </div>
              {commenting === post.id && <form className="comment-form" onSubmit={(event) => submitComment(event, post.id)}><input name="comment" autoFocus placeholder="Écrivez un commentaire..." /><button aria-label="Envoyer"><Send size={17} /></button></form>}
              {postComments.map((comment, index) => <p className="comment" key={index}><b>Vous</b>{comment}</p>)}
              <div className="order-row"><div><span>Plat du jour</span><strong>{post.price}</strong></div><button onClick={() => requireAuth(() => addToCart(post))}><Plus size={18} />Ajouter au panier</button><button className="order-now" onClick={() => requireAuth(() => { addToCart(post); router.push("/checkout"); })}>Commander</button></div>
            </article>;
          })}
          {visiblePosts.length === 0 && <div className="empty-state"><UtensilsCrossed size={34} /><h2>Aucun plat trouvé</h2><p>Essayez un autre mot-clé.</p></div>}
        </section>

        <aside className="right-sidebar" id="restaurants">
          <div className="sidebar-title"><h2>Restaurants populaires</h2><a href="/explorer">Voir tout</a></div>
          <div className="restaurant-list">{restaurants.map(([name, rating, distance, initials, color]) => <article key={name}><span style={{ backgroundColor: color }}>{initials}</span><div><strong>{name}</strong><p><b>★ {rating}</b> · {distance}</p></div><button onClick={() => requireAuth(() => alert(`${name} est maintenant dans vos favoris.`))}>Suivre</button></article>)}</div>
          <div className="tip-card"><span>MIAMGO CONSEIL</span><h3>Commandez avant midi pour être livré à l&apos;heure du déjeuner.</h3><a href="/explorer">Découvrir les plats <ChevronRight size={16} /></a></div>
        </aside>
      </div>

      <nav className="mobile-nav"><a className="active" href="#feed"><HomeIcon size={22} /><span>Accueil</span></a><a href="/explorer"><Search size={22} /><span>Explorer</span></a><button onClick={() => requireAuth(() => router.push("/panier"))}><ShoppingBag size={22} /><span>Panier</span>{cart.length > 0 && <i>{cart.length}</i>}</button><button onClick={() => requireAuth(() => router.push("/profil?tab=favorites"))}><Bookmark size={22} /><span>Sauvegardés</span></button><button onClick={() => user ? router.push("/profil") : setShowLogin(true)}><CircleUserRound size={22} /><span>Profil</span></button></nav>

      {showLogin && <div className="modal-backdrop" role="presentation"><section className="login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title"><button className="modal-close" onClick={() => setShowLogin(false)} aria-label="Fermer"><X size={20} /></button><div className="login-mark">m<span>go</span></div><p className="eyebrow">BIENVENUE SUR MIAMGO</p><h2 id="login-title">{authMode === "login" ? "Connectez-vous pour continuer" : "Créez votre compte gourmand"}</h2><p className="modal-text">Votre action vous attend juste après la connexion.</p><form onSubmit={handleAuth}><label>Adresse e-mail<input type="email" name="email" required placeholder="vous@exemple.com" /></label><label>Mot de passe<input type="password" name="password" required minLength="6" placeholder="6 caractères minimum" /></label>{authError && <p className="auth-error">{authError}</p>}<button className="submit-auth" disabled={isSubmitting}>{isSubmitting ? "Connexion..." : authMode === "login" ? "Se connecter" : "Créer mon compte"}</button></form><button className="switch-auth" onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); }}>{authMode === "login" ? "Pas encore de compte? S'inscrire" : "Déjà un compte? Se connecter"}</button></section></div>}
    </main>
  );
}
