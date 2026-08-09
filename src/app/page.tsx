import Link from "next/link";
import styles from "./page.module.css";

const benefits = [
  ["01", "Une vitrine qui vous ressemble", "Menu vivant, plats du jour et promotions au centre de votre boutique."],
  ["02", "Des commandes sans détour", "Retrait QR ou livraison, avec un suivi clair à chaque étape."],
  ["03", "Une communauté gourmande", "Partagez vos nouveautés et créez du lien avec vos clients."],
];

export default function Home() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Navigation principale">
        <Link href="/" className={styles.brand}><span>m</span>MiamGo</Link>
        <div className={styles.navLinks}>
          <a href="#restaurant">Pour les restaurants</a>
          <a href="#experience">L&apos;expérience</a>
        </div>
        <div className={styles.navActions}>
          <Link href="/connexion" className={styles.login}>Connexion</Link>
          <Link href="/inscription" className={styles.navCta}>Rejoindre MiamGo</Link>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>La table est ouverte</p>
          <h1>La bonne adresse<br />est <em>juste là.</em></h1>
          <p className={styles.intro}>Découvrez ce qui se prépare près de chez vous. Commandez, récupérez ou faites-vous livrer sans quitter votre rythme.</p>
          <div className={styles.heroActions}>
            <Link href="/inscription" className={styles.primaryAction}>Explorer les saveurs <span>→</span></Link>
            <a href="#restaurant" className={styles.secondaryAction}>Vous êtes restaurant <span>↗</span></a>
          </div>
          <div className={styles.proof}>
            <div className={styles.faces}><i>J</i><i>A</i><i>M</i><i>S</i></div>
            <p><strong>Des saveurs locales,</strong><br />des commandes simplifiées.</p>
          </div>
        </div>

        <div className={styles.heroVisual} aria-label="Sélection gourmande MiamGo">
          <div className={styles.sun} />
          <div className={styles.mainDish}>
            <div className={styles.dishLabel}><span>Le coup de coeur</span><strong>Ablo royal</strong><small>2 500 FCFA</small></div>
          </div>
          <div className={styles.floatingCard}>
            <span className={styles.cardIcon}>+</span>
            <div><small>Disponible maintenant</small><strong>La Maison Miam</strong></div>
            <span className={styles.arrow}>→</span>
          </div>
          <p className={styles.verticalText}>Cotonou, Bénin</p>
        </div>
      </section>

      <section className={styles.marquee} aria-label="Services MiamGo">
        <span>Commandez simplement</span><b>✳</b><span>Goûtez local</span><b>✳</b><span>Faites-vous livrer</span><b>✳</b><span>Partagez vos adresses</span><b>✳</b>
      </section>

      <section className={styles.experience} id="experience">
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Pensé pour le quotidien</p>
          <h2>Plus qu&apos;une commande.<br />Une <em>envie</em> partagée.</h2>
        </div>
        <div className={styles.benefitGrid}>
          {benefits.map(([number, title, text]) => <article key={number} className={styles.benefit}>
            <span>{number}</span><h3>{title}</h3><p>{text}</p><div className={styles.benefitLine} />
          </article>)}
        </div>
      </section>

      <section className={styles.restaurant} id="restaurant">
        <div className={styles.restaurantVisual}>
          <div className={styles.restaurantPhoto} />
          <div className={styles.orderCard}><small>Nouvelle commande</small><strong>#MG-2841</strong><p>2 plats · Retrait à 13:15</p><span>Confirmée</span></div>
        </div>
        <div className={styles.restaurantCopy}>
          <p className={styles.eyebrow}>Pour les restaurants</p>
          <h2>Votre cuisine mérite<br />sa <em>scène.</em></h2>
          <p>Créez votre boutique, recevez vos commandes en direct et gardez le lien avec les personnes qui aiment votre cuisine.</p>
          <ul><li>Votre menu et vos promotions en quelques instants</li><li>Retrait, livraison interne ou réseau de livreurs</li><li>Une communauté engagée autour de votre adresse</li></ul>
          <Link href="/inscription" className={styles.primaryAction}>Créer ma boutique <span>→</span></Link>
        </div>
      </section>

      <section className={styles.finalCta}>
        <p className={styles.eyebrow}>MiamGo vous attend</p>
        <h2>Prêt à trouver<br /><em>votre prochaine envie ?</em></h2>
        <Link href="/inscription" className={styles.lightAction}>Créer mon compte <span>→</span></Link>
      </section>

      <footer className={styles.footer}>
        <Link href="/" className={styles.brand}><span>m</span>MiamGo</Link>
        <p>Les bonnes tables, à portée de main.</p>
        <div><Link href="/connexion">Connexion</Link><Link href="/inscription">Inscription</Link><Link href="/admin">Administration</Link></div>
      </footer>
    </main>
  );
}
