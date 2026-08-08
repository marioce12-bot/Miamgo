# Miamgo

Miamgo est le fil d'actualites des restaurants et des plats pres de chez soi. Cette application Next.js place directement les publications des restaurants, promotions et plats du jour au coeur de l'accueil.

## Demarrage

```bash
npm install
npm run dev
```

Ouvrez ensuite `http://localhost:3000`.

## Firebase

La configuration du projet Firebase Miamgo est definie dans `src/lib/firebase.js`. Activez le fournisseur **E-mail/Mot de passe** dans Firebase Authentication pour permettre la creation de compte et la connexion.

Les likes, commentaires, favoris, panier et commandes sont proteges. Lorsqu'un visiteur les declenche sans etre connecte, Miamgo ouvre la connexion et rejoue automatiquement l'action une fois la session etablie.

Le cahier des charges produit est disponible dans [`docs/cahier-des-charges.md`](docs/cahier-des-charges.md).

## Application mobile

Le projet Expo React Native est dans [`mobile/`](mobile/). Il partage le projet Firebase Miamgo avec le site Next.js. Lancez-le avec `cd mobile` puis `npx expo start`.

## Firestore

Les regles de securite sont dans [`firestore.rules`](firestore.rules) et les index dans [`firestore.indexes.json`](firestore.indexes.json). Activez Cloud Firestore, puis copiez les regles dans **Firestore Database > Rules** de Firebase Console.

Les collections utilisees sont `users`, `restaurants`, `posts`, `favorites`, `carts`, `orders` et `notifications`. Un client ne peut acceder qu'a son propre profil, panier, favoris et commandes. Les donnees restaurant sont protegees par le champ `ownerId`.

Pour publier exactement les regles du depot avec Firebase CLI: `npx firebase-tools login`, puis `npx firebase-tools use miamgo-2479d` et `npx firebase-tools deploy --only firestore`. Sans cette publication, Firebase Authentication peut creer un e-mail mais Firestore refusera la creation du profil associe.

## Administration

La console web séparée est disponible à `/admin`. Configurez `MIAMGO_ADMIN_PASSWORD` dans les variables Vercel. Le mot de passe ne doit jamais être écrit dans Git. Cette page n'est pas liée depuis l'application mobile.

## Paiements

Les frais de commande sont calculés par `src/lib/orderFees.js`: 100 FCFA jusqu'à 2 000 FCFA, 150 FCFA jusqu'à 10 000 FCFA, puis 200 FCFA. Les routes serveur `/api/fedapay/create-transaction` et `/api/fedapay/webhook` gardent la clé FedaPay hors du navigateur. Activez et configurez les payouts/marketplace FedaPay avant d'activer les transferts vers les bénéficiaires restaurant et livreur.
