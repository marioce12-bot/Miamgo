"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { UserRole } from "@/lib/firestore/models";
import { canAccessRole, getRoleHome } from "@/lib/auth/roles";
import { useAuth } from "./auth-provider";

export function RoleGuard({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  const { user, profile, loading, configured } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading || !configured) return;

    if (!user || !profile) {
      router.replace(`/connexion?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!canAccessRole(profile.role, role)) {
      router.replace(getRoleHome(profile.role));
    }
  }, [configured, loading, pathname, profile, role, router, user]);

  if (!configured) {
    return <AccessMessage text="Firebase doit être configuré pour ouvrir cet espace." />;
  }

  if (loading || !user || !profile || !canAccessRole(profile.role, role)) {
    return <AccessMessage text="Vérification de votre accès..." />;
  }

  return children;
}

function AccessMessage({ text }: { text: string }) {
  return (
    <main className="access-state" role="status">
      <span className="loader" aria-hidden="true" />
      <p>{text}</p>
    </main>
  );
}
