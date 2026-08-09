import { describe, expect, it } from "vitest";
import { canAccessRole, getRoleHome } from "./roles";

const roles = ["client", "restaurant", "courier", "admin"] as const;

describe("role routing", () => {
  it.each([
    ["client", "/client"],
    ["restaurant", "/restaurant"],
    ["courier", "/livreur"],
    ["admin", "/admin"],
  ] as const)("redirects %s to %s", (role, path) => {
    expect(getRoleHome(role)).toBe(path);
  });

  it.each(roles)("only lets %s access its own space", (role) => {
    for (const requiredRole of roles) {
      expect(canAccessRole(role, requiredRole)).toBe(role === requiredRole);
    }
  });
});
