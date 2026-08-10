"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
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
  Share2,
  ShoppingBag,
  Sparkles,
  Store,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { addCartItem, addComment, addRestaurantReply, createStory, ensureCustomerProfile, getActiveStories, getFeedData, getPostEngagement, getUserProfile, saveFavorite, setPostLike } from "../lib/firestore";
import { shareFood } from "../lib/share";
import { usePreferences } from "./PreferencesProvider";

function StoryViewer({ stories, index, onClose }) {
  const story = stories[index];
  useEffect(() => { const timer = window.setTimeout(() => index + 1 < stories.length ? onClose(index + 1) : onClose(null), 5000); return () => window.clearTimeout(timer); }, [index, stories.length, onClose]);
  if (!story) return null;
  return <div className="story-viewer" role="dialog" aria-label="Story"><div className="story-progress"><span /></div><button className="story-viewer-close" onClick={() => onClose(null)}>×</button>{story.mediaType === "video" ? <video src={story.mediaUrl} autoPlay playsInline onEnded={() => onClose(index + 1 < stories.length ? index + 1 : null)} /> : <img src={story.mediaUrl} alt={`Story de ${story.authorName || "Utilisateur"}`} />}<strong>{story.authorName || "Utilisateur"}</strong></div>;
}
export default function MiamgoFeed() {
  const { t } = usePreferences() || { t: (key) => key };
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [liked, setLiked] = useState([]);
  const [saved, setSaved] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartToast, setCartToast] = useState("");
  const [comments, setComments] = useState({});
  const [replies, setReplies] = useState({});
  const [commenting, setCommenting] = useState(null);
  const [search, setSearch] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageErrors, setImageErrors] = useState([]);
  const [posts, setPosts] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [stories, setStories] = useState([]);
  const [feedError, setFeedError] = useState("");
  const [storyViewer, setStoryViewer] = useState(null);
  const [role, setRole] = useState("client");
  const [roleReady, setRoleReady] = useState(false);

  useEffect(() => { Promise.all([getFeedData().catch((error) => { setFeedError("Impossible de charger les publications. Vérifiez votre connexion puis réessayez."); return { posts: [], restaurants: [] }; }), getActiveStories().catch(() => [])]).then(([result, activeStories]) => { setPosts(result.posts); setRestaurants(result.restaurants); setStories(activeStories); }); }, []);

  useEffect(() => { if (!user || !posts.length) return; Promise.all(posts.map(async (post) => [post.id, await getPostEngagement(post.id, user.uid).catch(() => ({ count: post.likes || 0, liked: false }))])).then((entries) => { const engagement = new Map(entries); setPosts((current) => current.map((post) => ({ ...post, likes: engagement.get(post.id)?.count ?? post.likes }))); setLiked(entries.filter(([, value]) => value.liked).map(([id]) => id)); }); }, [user, posts.length]);

  useEffect(() => onAuthStateChanged(auth, async (session) => {
    setUser(session);
    if (session) {
      const profile = await getUserProfile(session.uid).catch(() => null);
      if (profile?.role) setRole(profile.role);
      // Un profil absent ne doit jamais être transformé automatiquement en client:
      // cela convertissait les inscriptions livreur/restaurateur incomplètes en comptes clients.
    } else {
      setRole("client");
    }
    setRoleReady(true);
  }), []);

  useEffect(() => {
    if (user && pendingAction) {
      const action = pendingAction;
      setPendingAction(null);
      action();
    }
  }, [user, pendingAction]);

  function requireAuth(action) {
    if (auth.currentUser) {
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
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await ensureCustomerProfile(credential.user);
      }
      setShowLogin(false);
    } catch (error) {
      setAuthError(error.code === "auth/operation-not-allowed" ? "Activez l'authentification E-mail/Mot de passe dans Firebase pour continuer." : "Connexion impossible. Vérifiez vos identifiants ou créez un compte.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleLike(id) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const isLiked = !liked.includes(id);
    setLiked((current) => isLiked ? [...current, id] : current.filter((item) => item !== id));
    setPostLike(currentUser.uid, id, isLiked).catch(console.error);
  }

  function toggleSave(id) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const isSaved = !saved.includes(id);
    const post = posts.find((item) => item.id === id);
    setSaved((current) => isSaved ? [...current, id] : current.filter((item) => item !== id));
    saveFavorite(currentUser.uid, post.restaurant.toLowerCase().replaceAll(" ", "-"), isSaved).catch(console.error);
  }

  function addToCart(post) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setCart((current) => { const next = [...current, post]; localStorage.setItem("miamgo-cart-count", String(next.length)); window.dispatchEvent(new Event("miamgo-cart-updated")); return next; });
    addCartItem(currentUser.uid, post).catch(console.error);
    setCartToast(`${post.dish} a été ajouté au panier.`);
    window.setTimeout(() => setCartToast(""), 2800);
  }

  function submitComment(event, postId) {
    event.preventDefault();
    const text = new FormData(event.currentTarget).get("comment")?.trim();
    if (!text) return;
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const comment = { id: `${currentUser.uid}-${Date.now()}`, text, userId: currentUser.uid, author: currentUser.email?.split("@")[0] || "Vous" };
    setComments((current) => ({ ...current, [postId]: [...(current[postId] || []), comment] }));
    addComment(currentUser.uid, postId, text).catch(console.error);
    setCommenting(null);
  }

  function submitReply(event, postId, commentId) { event.preventDefault(); const currentUser = auth.currentUser; const text = new FormData(event.currentTarget).get("reply")?.trim(); if (!text || !currentUser) return; setReplies((current) => ({ ...current, [commentId]: text })); addRestaurantReply(currentUser.uid, postId, commentId, text).catch(console.error); event.currentTarget.reset(); }

  async function publishStory(event) { const file = event.target.files?.[0]; if (!file || !auth.currentUser) return; try { const media = await (await import("../lib/storage")).uploadMediaFile(file); await createStory(auth.currentUser.uid, { authorName: auth.currentUser.email?.split("@")[0] || "Utilisateur", mediaUrl: media.url, mediaType: media.mediaType }); const activeStories = await getActiveStories(); setStories(activeStories); } catch (error) { console.error(error); } finally { event.target.value = ""; } }

  const visiblePosts = posts.filter((post) => `${post.restaurant} ${post.dish} ${post.text}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className={`app-shell ${roleReady ? "" : "role-feed-loading"}`}>{storyViewer !== null && <StoryViewer stories={stories} index={storyViewer} onClose={setStoryViewer}/>}
      <header className="topbar">
        <a className="brand brand-with-logo" href="/accueil" aria-label="Miamgo accueil"><img src="/miamgo-logo.png" alt="Logo Miamgo" /><span>miam</span>go<i>.</i></a>
        <label className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un plat, un resto..." /></label>
        <nav className="desktop-actions">
          <button className="icon-button" onClick={() => router.push(role === "restaurant_owner" ? "/espace-resto/profil" : "/profil")}><Settings size={20} /></button>
          {user ? <button className="profile-button" onClick={() => router.push("/profil")}><CircleUserRound size={22} /> {user.email?.split("@")[0] || "Mon profil"}</button> : <button className="login-button" onClick={() => setShowLogin(true)}>Se connecter</button>}
        </nav>
      </header>

      <div className="layout">
          {role === "restaurant_owner" ? <aside className="restaurant-feed-sidebar"><p className="eyebrow">ESPACE RESTAURANT</p><a className="active" href="/accueil"><HomeIcon size={19} />Fil Miamgo</a><a href="/espace-resto/commandes"><ShoppingBag size={19} />Commandes <b>3</b></a><a href="/espace-resto/menu"><Store size={19} />Mon menu</a><a href="/espace-resto/publier"><Sparkles size={19} />Publications</a><a href="/espace-resto/profil"><CircleUserRound size={19} />Profil boutique</a></aside> : <aside className="left-sidebar">
          <div className="location-card"><MapPin size={18} /><div><small>Votre position</small><strong>Cotonou, Bénin</strong></div><ChevronRight size={17} /></div>
          <nav className="side-nav">
            <a className="active" href="#feed"><HomeIcon size={20} />Actualités</a>
            <a href="/explorer"><Store size={20} />Restaurants</a>
            <button onClick={() => requireAuth(() => router.push("/panier"))}><ShoppingBag size={20} />Mon panier <b>{cart.length || ""}</b></button>
            <button onClick={() => requireAuth(() => router.push("/profil?tab=favorites"))}><Bookmark size={20} />Mes favoris</button>
          </nav>
          {role !== "restaurant_owner" && <div className="pro-card"><Sparkles size={21} /><strong>Votre resto sur Miamgo?</strong><p>Partagez vos plats avec les gourmands autour de vous.</p><a href="/inscription-resto">Créer ma boutique</a></div>}
          </aside>}

        <section className="feed" id="feed">
          <div className="feed-intro"><div><p className="eyebrow">{role === "restaurant_owner" ? t("feed") : t("nearby")}</p><h1>{role === "restaurant_owner" ? t("feed") : t("craving")}</h1></div>{role !== "restaurant_owner" && <button className="filter-button" onClick={() => document.querySelector(".search-box input")?.focus()}><Menu size={18} /> {t("filter")}</button>}</div>
          {feedError && <p className="settings-notice">{feedError}</p>}<div className="restaurant-stories">
            <label className="restaurant-story story-create-card"><input type="file" accept="image/*,video/*" onChange={publishStory} /><span className="story-add-icon">+</span><div><strong>Votre story</strong><small>Ajouter une photo ou vidéo</small></div></label>{stories.map((story, index) => <button className="restaurant-story" key={story.id} onClick={() => setStoryViewer(index)}><img src={story.mediaUrl} alt={`Story de ${story.authorName || "Utilisateur"}`} /><span className="story-shade" /><b style={{ backgroundColor: "#245d4c" }}>{(story.authorName || "U").slice(0, 2).toUpperCase()}</b><div><strong>{story.authorName || "Utilisateur"}</strong><small>Story</small></div></button>)}
          </div>

          {visiblePosts.map((post) => {
            const isLiked = liked.includes(post.id);
            const isSaved = saved.includes(post.id);
            const postComments = comments[post.id] || [];
            const broken = imageErrors.includes(post.id);
            const sharePost = () => shareFood({ title: post.dish, restaurant: post.restaurant, imageUrl: post.image, url: `${window.location.origin}/accueil#post-${post.id}` });
            return <article className="post-card" id={`post-${post.id}`} key={post.id}>
              {post.promoted && <div className="sponsored"><Sparkles size={14} /> En ce moment près de vous</div>}
              <div className="post-head"><button className="restaurant-avatar" style={{ backgroundColor: post.color }} onClick={() => router.push("/restaurant/chez-aicha")} aria-label={`Voir ${post.restaurant}`}>{post.avatar}</button><div><button className="restaurant-name" onClick={() => router.push("/restaurant/chez-aicha")}>{post.restaurant}</button><p>{post.handle} <span>·</span> {post.time}</p><small><MapPin size={12} />{post.location}</small></div><button className="more" onClick={sharePost}><Share2 size={18} /></button></div>
              <p className="post-copy">{post.text}</p>
              <div className={`food-image ${broken ? "image-fallback" : ""}`} style={broken ? { background: `linear-gradient(135deg, ${post.color}, #ffc66b)` } : undefined}>
                {!broken && (post.mediaType === "video" ? <video src={post.mediaUrl} controls playsInline preload="metadata" /> : <img src={post.mediaUrl || post.image} alt={post.dish} onError={() => setImageErrors((current) => [...current, post.id])} />)}
                {broken && <div><UtensilsCrossed size={42} /><strong>{post.dish}</strong><span>Une belle assiette vous attend</span></div>}
                <span className="dish-label">{post.dish}<b>{post.price}</b></span>
              </div>
              <div className="post-meta"><span>{post.likes + (isLiked ? 1 : 0)} j&apos;aime</span><span>{post.comments + postComments.length} commentaires</span></div>
              <div className="post-actions">
                <button className={isLiked ? "liked" : ""} onClick={() => requireAuth(() => toggleLike(post.id))}><Heart size={20} fill={isLiked ? "currentColor" : "none"} />J&apos;aime</button>
                <button onClick={() => requireAuth(() => setCommenting(post.id))}><MessageCircle size={20} />Commenter</button>
                <button className={isSaved ? "saved" : ""} onClick={() => requireAuth(() => toggleSave(post.id))}><Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />Sauvegarder</button>
                <button onClick={sharePost}><Share2 size={20} />Partager</button>
              </div>
              {commenting === post.id && <form className="comment-form" onSubmit={(event) => submitComment(event, post.id)}><input name="comment" autoFocus placeholder="Écrivez un commentaire..." /><button aria-label="Envoyer"><Send size={17} /></button></form>}
              {postComments.map((comment) => <div className="comment-thread" key={comment.id}><p className="comment"><b>{comment.author}</b>{comment.text}</p>{role === "restaurant_owner" && post.restaurantId === "chez-aicha" && <form className="reply-form" onSubmit={(event) => submitReply(event, post.id, comment.id)}><input name="reply" placeholder="Répondre au client..." /><button>Répondre</button></form>}{replies[comment.id] && <p className="restaurant-reply"><b>Réponse du restaurant</b>{replies[comment.id]}</p>}</div>)}
              <div className="order-row"><div><span>Plat du jour</span><strong>{post.price}</strong></div><button onClick={() => requireAuth(() => addToCart(post))}><Plus size={18} />Ajouter au panier</button><button className="order-now" onClick={() => requireAuth(() => { addToCart(post); router.push("/checkout"); })}>Commander</button></div>
            </article>;
          })}
          {visiblePosts.length === 0 && <div className="empty-state"><UtensilsCrossed size={34} /><h2>Aucun plat trouvé</h2><p>Essayez un autre mot-clé.</p></div>}
        </section>

        {role !== "restaurant_owner" && <aside className="right-sidebar" id="restaurants">
          <div className="sidebar-title"><h2>Restaurants populaires</h2><a href="/explorer">Voir tout</a></div>
          <div className="restaurant-list">{restaurants.map(([name, rating, distance, initials, color]) => <article key={name}><span style={{ backgroundColor: color }}>{initials}</span><div><strong>{name}</strong><p><b>★ {rating}</b> · {distance}</p></div><button onClick={() => requireAuth(() => alert(`${name} est maintenant dans vos favoris.`))}>Suivre</button></article>)}</div>
          <div className="tip-card"><span>MIAMGO CONSEIL</span><h3>Commandez avant midi pour être livré à l&apos;heure du déjeuner.</h3><a href="/explorer">Découvrir les plats <ChevronRight size={16} /></a></div>
        </aside>}
      </div>


      {cartToast && <div className="cart-toast">✓ {cartToast}</div>}
      {showLogin && <div className="modal-backdrop" role="presentation"><section className="login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title"><button className="modal-close" onClick={() => setShowLogin(false)} aria-label="Fermer"><X size={20} /></button><div className="login-mark">m<span>go</span></div><p className="eyebrow">BIENVENUE SUR MIAMGO</p><h2 id="login-title">Connectez-vous pour continuer</h2><p className="modal-text">Votre action vous attend juste après la connexion.</p><form onSubmit={handleAuth}><label>Adresse e-mail<input type="email" name="email" required placeholder="vous@exemple.com" /></label><label>Mot de passe<input type="password" name="password" required minLength="6" placeholder="Votre mot de passe" /></label>{authError && <p className="auth-error">{authError}</p>}<button className="submit-auth" disabled={isSubmitting}>{isSubmitting ? "Connexion..." : "Se connecter"}</button></form><button className="switch-auth" onClick={() => router.push("/inscription-client")}>Pas encore de compte? S&apos;inscrire</button></section></div>}
    </main>
  );
}
