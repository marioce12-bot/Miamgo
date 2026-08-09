"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/auth/auth-service";
import type { UserRole } from "@/lib/firestore/models";
import { RoleGuard } from "./role-guard";
import { useAuth } from "./auth-provider";
import styles from "./dashboard-shell.module.css";

const content: Record<UserRole, { label: string; title: string; description: string }> = {
  client: { label: "Espace client", title: "Qu'est-ce qu'on mange ?", description: "Découvrez les tables du moment et suivez vos commandes." },
  restaurant: { label: "Espace restaurant", title: "Votre salle numérique.", description: "Gérez votre boutique, vos plats et les commandes en cours." },
  courier: { label: "Espace livreur", title: "Prêt pour la prochaine course.", description: "Consultez les livraisons disponibles et votre activité." },
  agency: { label: "Espace agence", title: "Pilotez vos livraisons.", description: "Organisez les courses et votre réseau de livreurs." },
  admin: { label: "Administration", title: "MiamGo, vue d'ensemble.", description: "Supervisez les utilisateurs, abonnements et opérations." },
};

export function DashboardShell({ role }: { role: UserRole }) {
  return (
    <RoleGuard role={role}>
      <Dashboard role={role} />
    </RoleGuard>
  );
}

function Dashboard({ role }: { role: UserRole }) {
  const { profile } = useAuth();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const copy = content[role];

  async function handleLogout() {
    setLeaving(true);
    await logout();
    router.replace("/connexion");
  }

  return (
    <main className={styles.page}>
      <nav>
        <strong>MiamGo</strong>
        <button onClick={handleLogout} disabled={leaving}>Déconnexion</button>
      </nav>
      <section>
        <p className={styles.label}>{copy.label}</p>
        <h1>{copy.title}</h1>
        <p className={styles.description}>{copy.description}</p>
        <div className={styles.identity}>
          <span>Connecté en tant que</span>
          <strong>{profile?.displayName}</strong>
          <small>{profile?.email}</small>
        </div>
      </section>
    </main>
  );
}
