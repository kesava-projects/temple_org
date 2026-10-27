export const ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

export function isValidRole(role: string): role is AppRole {
  return role === ROLES.USER || role === ROLES.ADMIN;
}

export function isAdmin(role: string | null | undefined): boolean {
  return role === ROLES.ADMIN;
}
