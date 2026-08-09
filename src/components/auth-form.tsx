"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { loginWithEmail, registerWithEmail } from "@/lib/auth/auth-service";
import { getRoleHome, SIGNUP_ROLES } from "@/lib/auth/roles";
import type { OpeningHours, UserRole } from "@/lib/firestore/models";
import { useAuth } from "./auth-provider";
import styles from "./auth-form.module.css";

function getErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";

  if (code.includes("email-already-in-use")) return "Cet e-mail est déjà utilisé.";
  if (code.includes("invalid-credential")) return "E-mail ou mot de passe incorrect.";
  if (code.includes("weak-password")) return "Utilisez un mot de passe d'au moins 6 caractères.";
  if (code.includes("invalid-email")) return "L'adresse e-mail est invalide.";
  return error instanceof Error ? error.message : "Une erreur est survenue.";
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { profile, configured } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("client");
  const [restaurantAddress, setRestaurantAddress] = useState("");
  const [restaurantPhone, setRestaurantPhone] = useState("");
  const [restaurantEmail, setRestaurantEmail] = useState("");
  const [openingHours, setOpeningHours] = useState<OpeningHours>({
    monday: "08:00 - 22:00",
    tuesday: "08:00 - 22:00",
    wednesday: "08:00 - 22:00",
    thursday: "08:00 - 22:00",
    friday: "08:00 - 23:00",
    saturday: "08:00 - 23:00",
    sunday: "Fermé",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) router.replace(getRoleHome(profile.role));
  }, [profile, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const destinationRole =
        mode === "register"
          ? await registerWithEmail({
              displayName,
              email,
              password,
              role,
              restaurant:
                role === "restaurant"
                  ? {
                      address: restaurantAddress,
                      phone: restaurantPhone,
                      contactEmail: restaurantEmail,
                      openingHours,
                    }
                  : undefined,
            })
          : await loginWithEmail(email, password);
      router.replace(getRoleHome(destinationRole));
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.brandPanel}>
        <Link href="/" className={styles.logo}>MiamGo</Link>
        <div>
          <p className={styles.kicker}>Bienvenue à table</p>
          <h1>{mode === "login" ? "Retrouvez votre espace." : "Créez votre espace."}</h1>
          <p>Restaurants, clients et livreurs réunis dans une même expérience.</p>
        </div>
      </section>

      <section className={styles.formPanel}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div>
            <p className={styles.step}>{mode === "login" ? "Connexion" : "Inscription"}</p>
            <h2>{mode === "login" ? "Heureux de vous revoir" : "Rejoindre MiamGo"}</h2>
          </div>

          {!configured && (
            <p className={styles.error}>Firebase n&apos;est pas encore configuré.</p>
          )}

          {mode === "register" && (
            <>
              <label>
                Nom affiché
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required minLength={2} autoComplete="name" />
              </label>
              <label>
                Type de compte
                <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
                  {SIGNUP_ROLES.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              {role === "restaurant" && (
                <fieldset className={styles.restaurantFields}>
                  <legend>Informations du restaurant</legend>
                  <label>
                    Adresse complète
                    <input value={restaurantAddress} onChange={(event) => setRestaurantAddress(event.target.value)} required />
                  </label>
                  <label>
                    Téléphone
                    <input type="tel" value={restaurantPhone} onChange={(event) => setRestaurantPhone(event.target.value)} required autoComplete="tel" />
                  </label>
                  <label>
                    E-mail de contact
                    <input type="email" value={restaurantEmail} onChange={(event) => setRestaurantEmail(event.target.value)} required />
                  </label>
                  <div className={styles.hoursGrid}>
                    {([
                      ["monday", "Lundi"], ["tuesday", "Mardi"],
                      ["wednesday", "Mercredi"], ["thursday", "Jeudi"],
                      ["friday", "Vendredi"], ["saturday", "Samedi"],
                      ["sunday", "Dimanche"],
                    ] as const).map(([day, label]) => (
                      <label key={day}>
                        {label}
                        <input value={openingHours[day]} onChange={(event) => setOpeningHours((current) => ({ ...current, [day]: event.target.value }))} required />
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            </>
          )}

          <label>
            Adresse e-mail
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </label>
          <label>
            Mot de passe
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </label>

          {error && <p className={styles.error} role="alert">{error}</p>}

          <button type="submit" disabled={submitting || !configured}>
            {submitting ? "Un instant..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
          </button>

          <p className={styles.switchLink}>
            {mode === "login" ? "Pas encore de compte ?" : "Déjà inscrit ?"}{" "}
            <Link href={mode === "login" ? "/inscription" : "/connexion"}>
              {mode === "login" ? "S'inscrire" : "Se connecter"}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
