import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "./roles";
import type { User } from "@prisma/client";

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: "UNAUTHENTICATED" | "UNAUTHORIZED" | "ACCOUNT_INACTIVE" | "FORBIDDEN"
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export interface AuthenticatedContext {
  user: User;
  sessionToken: string;
}

/**
 * Retrieves the current session and validates user active status from the database.
 * Returns null if unauthenticated or deactivated.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const headerList = await headers();
    const session = await auth.api.getSession({
      headers: headerList,
    });

    if (!session?.user?.id) {
      return null;
    }

    const userInDb = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!userInDb || !userInDb.isActive) {
      return null;
    }

    return userInDb;
  } catch {
    return null;
  }
}

/**
 * Security Rule 1: Every admin page, server action and API route calls requireAdmin() on the server first.
 * Immediately rejects if the user is not found, not active, or not an ADMIN.
 *
 * @param redirectToLogin If true (default for pages), redirects to /admin/login when unauthorized.
 */
export async function requireAdmin(redirectToLogin = true): Promise<User> {
  const headerList = await headers();
  const session = await auth.api.getSession({
    headers: headerList,
  });

  if (!session?.user?.id) {
    if (redirectToLogin) {
      redirect("/admin/login");
    }
    throw new AuthError("Authentication required.", "UNAUTHENTICATED");
  }

  // Always query database directly to ensure deactivation takes effect immediately
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    if (redirectToLogin) {
      redirect("/admin/login");
    }
    throw new AuthError("Admin account not found.", "UNAUTHENTICATED");
  }

  if (!user.isActive) {
    if (redirectToLogin) {
      redirect("/admin/login?error=account_deactivated");
    }
    throw new AuthError("Admin account has been deactivated.", "ACCOUNT_INACTIVE");
  }

  if (user.role !== ROLES.ADMIN) {
    if (redirectToLogin) {
      redirect("/admin/login?error=forbidden");
    }
    throw new AuthError("Admin privileges required.", "FORBIDDEN");
  }

  return user;
}

/**
 * Requires an authenticated devotee (USER or ADMIN role).
 *
 * @param redirectToLogin If true, redirects to /login when unauthenticated.
 */
export async function requireUser(redirectToLogin = true): Promise<User> {
  const headerList = await headers();
  const session = await auth.api.getSession({
    headers: headerList,
  });

  if (!session?.user?.id) {
    if (redirectToLogin) {
      redirect("/login");
    }
    throw new AuthError("Authentication required.", "UNAUTHENTICATED");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || !user.isActive) {
    if (redirectToLogin) {
      redirect("/login?error=account_inactive");
    }
    throw new AuthError("Account inactive or not found.", "ACCOUNT_INACTIVE");
  }

  return user;
}
