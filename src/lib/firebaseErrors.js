export function explainAuthError(error, fallback = "Impossible de créer le compte. Vérifiez les informations saisies.") {
  switch (error?.code) {
    case "auth/email-already-in-use": return "Cette adresse e-mail possède déjà un compte. Connectez-vous ou utilisez une autre adresse.";
    case "auth/invalid-email": return "Cette adresse e-mail n’est pas valide.";
    case "auth/weak-password": return "Le mot de passe doit contenir au moins 6 caractères.";
    case "auth/operation-not-allowed": return "Ce mode de création de compte n’est pas activé. Contactez l’administration.";
    case "auth/network-request-failed": return "Connexion impossible. Vérifiez votre accès Internet.";
    case "auth/too-many-requests": return "Trop de tentatives. Patientez quelques minutes avant de réessayer.";
    default: return fallback;
  }
}
