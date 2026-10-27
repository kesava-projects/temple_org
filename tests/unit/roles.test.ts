import { describe, it, expect } from "vitest";
import { ROLES, isValidRole, isAdmin } from "@/server/auth/roles";

describe("Role Handling and Boundaries", () => {
  it("should have exactly two system roles: USER and ADMIN", () => {
    expect(ROLES).toEqual({
      USER: "USER",
      ADMIN: "ADMIN",
    });
  });

  it("should validate recognized roles correctly", () => {
    expect(isValidRole("USER")).toBe(true);
    expect(isValidRole("ADMIN")).toBe(true);
    expect(isValidRole("SUPERADMIN")).toBe(false);
    expect(isValidRole("GUEST")).toBe(false);
    expect(isValidRole("")).toBe(false);
  });

  it("should identify admin roles correctly", () => {
    expect(isAdmin("ADMIN")).toBe(true);
    expect(isAdmin("USER")).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });
});
