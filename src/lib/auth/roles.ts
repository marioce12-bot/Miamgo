import type { UserRole } from "@/lib/firestore/models";

export const ROLE_HOME: Record<UserRole, string> = {
  client: "/client",
  restaurant: "/restaurant",
  courier: "/livreur",
  admin: "/admin",
  agency: "/agence",
};

export const SIGNUP_ROLES = [
  { value: "client", label: "Client" },
  { value: "restaurant", label: "Restaurant" },
  { value: "courier", label: "Livreur" },
] as const satisfies ReadonlyArray<{ value: UserRole; label: string }>;

export function getRoleHome(role: UserRole): string {
  return ROLE_HOME[role];
}

export function canAccessRole(
  currentRole: UserRole,
  requiredRole: UserRole,
): boolean {
  return currentRole === requiredRole;
}

export function isUserRole(value: unknown): value is UserRole {
  return ["client", "restaurant", "courier", "agency", "admin"].includes(
    String(value),
  );
}
