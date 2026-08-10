"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bike, CheckCircle2, Mail, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import PlatformShell from "../../components/PlatformShell";
import { createDriverAffiliation, createDriverApplication, registerProfile, publishDriverDirectory } from "../../lib/firestore";
import { uploadImageFile } from "../../lib/storage";
import { authenticateForSignup, createServerSession, explainAuthError, signupDestination } from "../../lib/auth/signup";

const countries = [["BJ", "Bénin"], ["CV", "Cap-Vert"], ["CI", "Côte d’Ivoire"], ["GM", "Gambie"], ["GH", "Ghana"], ["GN", "Guinée"], ["GW", "Guinée-Bissau"], ["LR", "Libéria"], ["NG", "Nigeria"], ["SN", "Sénégal"], ["SL", "Sierra Leone"], ["TG", "Togo"]];

export default function DriverApplication() {
  const [restaurantId, setRestaurantId] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [idFile, setIdFile] = useState(null);
  const router = useRouter();

  useEffect(() => setRestaurantId(new URLSearchParams(window.location.search).get("restaurant")), []);

  async function apply(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!idFile) { setStatus("La photo de la pièce d’identité est obligatoire."); return; }
    setLoading(true); setStatus("");
    try {
      const { user, profile: existingProfile } = await authenticateForSignup(data.get("email"), data.get("password"), "driver");
      const profile = { displayName: `${data.get("firstName")} ${data.get("lastName")}`, phone: data.get("phone"), country: data.get("country"), city: data.get("city"), role: "driver", verificationStatus: "pending", subscriptionStatus: "locked", availabilityStatus: "unavailable" };
      if (!existingProfile) await registerProfile(user, profile);
      const identityDocumentUrl = await uploadImageFile(idFile, { maxWidth: 1800, quality: .82 });
      await createDriverApplication(user.uid, { firstName: data.get("firstName"), lastName: data.get("lastName"), phone: data.get("phone"), city: data.get("city"), country: data.get("country"), gender: data.get("gender"), identityDocumentUrl, restaurantInvitation: restaurantId || null });
      await publishDriverDirectory(user.uid, profile);
      if (restaurantId) await createDriverAffiliation(user.uid, restaurantId, restaurantId);
      await createServerSession(user);
      router.replace(signupDestination("driver"));
    } catch (error) {
      setStatus(error.code === "phone-already-used" ? "Ce numéro de téléphone est déjà associé à un compte." : error.code === "permission-denied" ? "Impossible d’enregistrer le profil. Les règles Firebase refusent cette opération." : explainAuthError(error));
    } finally { setLoading(false); }
  }

  return <PlatformShell publicPage><main className="onboarding-page driver-application"><Link className="back-link" href="/"><ArrowLeft size={17}/>Retour à Miamgo</Link><div className="onboarding-title"><p className="eyebrow">COMPTE LIVREUR</p><h1>Livrez les repas de votre ville.</h1><p>Votre compte peut être affilié à plusieurs restaurants. Votre pièce d’identité sera vérifiée avant activation.</p></div><form className="onboarding-form" onSubmit={apply}><section><Bike size={28}/><h2>Vos informations</h2><label>Prénom<input name="firstName" required/></label><label>Nom<input name="lastName" required/></label><label><Mail size={14}/>Adresse e-mail<input name="email" type="email" required/></label><label>Mot de passe<input name="password" type="password" minLength="6" required/></label><label>Numéro de téléphone<input name="phone" required placeholder="+229 00 00 00 00"/></label><label>Pays<select name="country" defaultValue="BJ">{countries.map(([code, name]) => <option value={code} key={code}>{name} ({code})</option>)}</select></label><label>Ville<input name="city" required placeholder="Votre ville"/></label><label>Sexe<select name="gender" defaultValue=""><option value="" disabled>Choisir</option><option>Femme</option><option>Homme</option><option>Préfère ne pas préciser</option></select></label><label className="identity-upload"><Upload size={16}/>Photo de la pièce d’identité<input type="file" accept="image/*" required onChange={(event) => setIdFile(event.target.files?.[0] || null)}/><small>{idFile ? `Fichier sélectionné: ${idFile.name}` : "Document obligatoire pour la validation"}</small></label></section><button className="create-restaurant" type="submit" disabled={loading}>{loading ? "Téléversement et création..." : "Créer mon compte livreur"}</button>{status && <p className="onboarding-status"><CheckCircle2 size={15}/>{status}</p>}<p className="onboarding-login">Déjà inscrit? <Link href="/connexion">Se connecter</Link></p></form></main></PlatformShell>;
}
