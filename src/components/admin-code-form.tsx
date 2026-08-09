"use client";

import { useState, type FormEvent } from "react";
import styles from "./admin-code-form.module.css";

export function AdminCodeForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (response.ok) {
      window.location.reload();
      return;
    }
    setError("Le code d'accès est invalide.");
    setLoading(false);
  }

  return <main className={styles.page}><section className={styles.card}><p>MiamGo / Administration</p><h1>Accès sécurisé</h1><span>Cette zone est réservée à l&apos;équipe MiamGo.</span><form onSubmit={submit}><label>Code d&apos;accès<input value={code} onChange={(event) => setCode(event.target.value)} type="password" autoComplete="one-time-code" required autoFocus /></label>{error && <small role="alert">{error}</small>}<button disabled={loading}>{loading ? "Vérification..." : "Accéder au back-office"}</button></form></section></main>;
}
