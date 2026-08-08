# Miamgo Mobile

Application React Native Expo de Miamgo.

## Démarrage

```bash
npm install
npx expo start
```

Scannez le QR affiché avec Expo Go pour tester sur un téléphone réel.

## Firebase

La configuration Firebase partagée est dans `src/firebase.js`. L'application mobile utilise le même projet Firebase que le site web.

## Bundle

```bash
npx expo export --platform android
```

Pour produire les fichiers des stores, utilisez ensuite EAS Build:

```bash
npx eas build:configure
npx eas build --platform android
npx eas build --platform ios
```

Le profil `preview` produit un APK Android installable. Le profil `production` produit un AAB Android pour Google Play et un IPA iOS. EAS demande une connexion Expo; la compilation iOS demande aussi un compte Apple Developer et ses identifiants de signature.

Les permissions caméra et notifications sont demandées au premier lancement. Les permissions natives sont déclarées dans `app.json`.
