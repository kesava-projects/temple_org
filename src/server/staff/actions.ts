"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdmin, requireUser } from "@/server/auth/guards";
import { staffService, StaffServiceError } from "@/server/staff/staff.service";

async function getClientIp(): Promise<string | undefined> {
  const headerList = await headers();
  return (
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    undefined
  );
}

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Server Action: Invite a new staff member (Admin only).
 * Security Rules: 1 (requireAdmin), 7 (TOTP re-auth for sensitive ops), 8 (rate limiting), 9 (audit logging).
 */
export async function createStaffInviteAction(input: {
  email: string;
  totpCode?: string;
}): Promise<ActionResult<{ inviteUrl: string; email: string; expiresAt: Date }>> {
  try {
    const admin = await requireAdmin();
    const ip = await getClientIp();

    const result = await staffService.createStaffInvite(
      {
        id: admin.id,
        name: admin.name,
        role: admin.role,
      },
      { email: input.email },
      input.totpCode,
      ip
    );

    revalidatePath("/admin/staff");

    return {
      success: true,
      data: {
        inviteUrl: result.inviteUrl,
        email: result.email,
        expiresAt: result.expiresAt,
      },
    };
  } catch (error) {
    if (error instanceof StaffServiceError) {
      return { success: false, error: error.message, code: error.code };
    }
    const message = error instanceof Error ? error.message : "Failed to generate staff invitation.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Accept a staff invitation.
 * Security Rules: Verified email matching the invite, single-use, 48h expiration.
 */
export async function acceptStaffInviteAction(
  rawToken: string
): Promise<ActionResult<{ role: string }>> {
  try {
    const user = await requireUser();
    const ip = await getClientIp();

    const updatedUser = await staffService.acceptStaffInvite(
      rawToken,
      {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name,
      },
      ip
    );

    revalidatePath("/admin");
    revalidatePath("/admin/staff");
    revalidatePath(`/invite/${rawToken}`);

    return {
      success: true,
      data: { role: updatedUser.role },
    };
  } catch (error) {
    if (error instanceof StaffServiceError) {
      return { success: false, error: error.message, code: error.code };
    }
    const message = error instanceof Error ? error.message : "Failed to accept staff invitation.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Deactivate an administrative staff member.
 * Security Rules: Last-admin protection, immediate session invalidation, TOTP re-auth.
 */
export async function deactivateStaffAction(
  targetStaffId: string,
  totpCode?: string
): Promise<ActionResult<{ invalidatedSessions: number }>> {
  try {
    const admin = await requireAdmin();
    const ip = await getClientIp();

    const result = await staffService.deactivateStaffMember(
      admin.id,
      targetStaffId,
      totpCode,
      ip
    );

    revalidatePath("/admin/staff");

    return {
      success: true,
      data: { invalidatedSessions: result.invalidatedSessions ?? 0 },
    };
  } catch (error) {
    if (error instanceof StaffServiceError) {
      return { success: false, error: error.message, code: error.code };
    }
    const message = error instanceof Error ? error.message : "Failed to deactivate staff member.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Reactivate an inactive staff member.
 */
export async function reactivateStaffAction(
  targetStaffId: string,
  totpCode?: string
): Promise<ActionResult<void>> {
  try {
    const admin = await requireAdmin();
    const ip = await getClientIp();

    await staffService.reactivateStaffMember(admin.id, targetStaffId, totpCode, ip);

    revalidatePath("/admin/staff");

    return { success: true };
  } catch (error) {
    if (error instanceof StaffServiceError) {
      return { success: false, error: error.message, code: error.code };
    }
    const message = error instanceof Error ? error.message : "Failed to reactivate staff member.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Demote an administrator back to USER.
 * Security Rules: Last-admin protection, session invalidation.
 */
export async function demoteStaffAction(
  targetStaffId: string,
  totpCode?: string
): Promise<ActionResult<void>> {
  try {
    const admin = await requireAdmin();
    const ip = await getClientIp();

    await staffService.demoteStaffMember(admin.id, targetStaffId, totpCode, ip);

    revalidatePath("/admin/staff");

    return { success: true };
  } catch (error) {
    if (error instanceof StaffServiceError) {
      return { success: false, error: error.message, code: error.code };
    }
    const message = error instanceof Error ? error.message : "Failed to demote staff member.";
    return { success: false, error: message };
  }
}
