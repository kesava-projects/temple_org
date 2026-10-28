import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/server/audit/audit-logger";
import { communications } from "@/server/notifications/communications";
import { checkRateLimit } from "@/server/security/rate-limiter";
import { verifyTotpCode } from "@/server/auth/totp";

export class StaffServiceError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "UNAUTHORIZED"
      | "NOT_FOUND"
      | "INVITE_EXPIRED"
      | "INVITE_USED"
      | "EMAIL_MISMATCH"
      | "EMAIL_NOT_VERIFIED"
      | "LAST_ADMIN"
      | "ALREADY_ADMIN"
      | "RATE_LIMITED"
      | "MFA_REQUIRED"
      | "MFA_INVALID"
      | "VALIDATION_ERROR"
  ) {
    super(message);
    this.name = "StaffServiceError";
  }
}

export const StaffInviteInputSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address.")
    .transform((e) => e.toLowerCase()),
});

export type StaffInviteInput = z.infer<typeof StaffInviteInputSchema>;

export const staffService = {
  /**
   * Hashes a raw token using SHA-256 for secure database storage.
   */
  hashToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  },

  /**
   * Generates a 64-character cryptographically secure token.
   */
  generateSecureToken(): string {
    return crypto.randomBytes(32).toString("hex");
  },

  /**
   * Verifies an administrator's TOTP code before sensitive operations (Security Rule 7).
   */
  async verifyAdminMfa(adminId: string, totpCode?: string): Promise<boolean> {
    const twoFactorRecord = await prisma.twoFactor.findFirst({
      where: { userId: adminId, verified: true },
    });

    // If TOTP is configured, require a valid code
    if (twoFactorRecord?.secret) {
      if (!totpCode || totpCode.trim().length !== 6) {
        throw new StaffServiceError(
          "A valid 6-digit TOTP code is required to authorize this sensitive action.",
          "MFA_REQUIRED"
        );
      }

      const isValid = verifyTotpCode(twoFactorRecord.secret, totpCode);
      if (!isValid) {
        throw new StaffServiceError(
          "Invalid or expired TOTP code. Please check your authenticator app.",
          "MFA_INVALID"
        );
      }
      return true;
    }

    return true;
  },

  /**
   * Creates and dispatches a 48-hour time-limited staff invite (Security Rule: Admin invites).
   */
  async createStaffInvite(
    inviterAdmin: { id: string; name?: string | null; role: string },
    rawInput: unknown,
    totpCode?: string,
    ip?: string
  ) {
    if (inviterAdmin.role !== "ADMIN") {
      throw new StaffServiceError("Only active administrators may invite staff.", "UNAUTHORIZED");
    }

    // Rate limiting: 5 invites per 10 minutes (Security Rule 8)
    const rateLimitKey = ip || inviterAdmin.id;
    const rl = await checkRateLimit(rateLimitKey, "invite");
    if (!rl.success) {
      throw new StaffServiceError(
        "Too many staff invitations generated. Please wait before attempting again.",
        "RATE_LIMITED"
      );
    }

    // Require TOTP re-auth for sensitive staff operations (Security Rule 7)
    await this.verifyAdminMfa(inviterAdmin.id, totpCode);

    const parseResult = StaffInviteInputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const msg = parseResult.error.issues.map((i) => i.message).join(", ");
      throw new StaffServiceError(msg, "VALIDATION_ERROR");
    }

    const { email } = parseResult.data;

    // Check if user is already an active admin
    const existingAdmin = await prisma.user.findFirst({
      where: { email, role: "ADMIN", isActive: true },
    });

    if (existingAdmin) {
      throw new StaffServiceError(
        `User ${email} is already an active administrator.`,
        "ALREADY_ADMIN"
      );
    }

    const rawToken = this.generateSecureToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours time-limited

    // Upsert StaffInvite record
    const invite = await prisma.staffInvite.upsert({
      where: { email },
      create: {
        email,
        tokenHash,
        invitedById: inviterAdmin.id,
        expiresAt,
        usedAt: null,
      },
      update: {
        tokenHash,
        invitedById: inviterAdmin.id,
        expiresAt,
        usedAt: null,
      },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const inviteUrl = `${siteUrl}/invite/${rawToken}`;

    // Dispatch invitation email via Resend
    await communications.sendStaffInviteEmail({
      to: email,
      inviteUrl,
      invitedByName: inviterAdmin.name || "Temple Administrator",
    });

    // Immutable Audit Log (Security Rule 9)
    await logAuditEvent({
      userId: inviterAdmin.id,
      action: "STAFF_INVITE_CREATED",
      entity: "StaffInvite",
      entityId: invite.id,
      meta: {
        invitedEmail: email,
        expiresAt: expiresAt.toISOString(),
      },
      ip,
    });

    return {
      inviteId: invite.id,
      email: invite.email,
      expiresAt: invite.expiresAt,
      rawToken,
      inviteUrl,
    };
  },

  /**
   * Retrieves an invitation by raw token and verifies expiration status.
   */
  async getStaffInviteByToken(rawToken: string) {
    if (!rawToken || typeof rawToken !== "string" || rawToken.trim().length === 0) {
      return { valid: false, reason: "NOT_FOUND" as const, invite: null };
    }

    const tokenHash = this.hashToken(rawToken.trim());
    const invite = await prisma.staffInvite.findUnique({
      where: { tokenHash },
      include: {
        invitedBy: {
          select: { name: true, email: true },
        },
      },
    });

    if (!invite) {
      return { valid: false, reason: "NOT_FOUND" as const, invite: null };
    }

    if (invite.usedAt) {
      return { valid: false, reason: "INVITE_USED" as const, invite };
    }

    if (invite.expiresAt < new Date()) {
      return { valid: false, reason: "INVITE_EXPIRED" as const, invite };
    }

    return { valid: true, reason: null, invite };
  },

  /**
   * Accepts staff invitation.
   * Security Rule: Accepted ONLY when OAuth provider returns a VERIFIED email matching the invite.
   */
  async acceptStaffInvite(
    rawToken: string,
    sessionUser: { id: string; email: string; emailVerified: boolean; name?: string },
    ip?: string
  ) {
    // Rate limiting on acceptance attempts (Security Rule 8)
    const rateLimitKey = ip || sessionUser.id;
    const rl = await checkRateLimit(rateLimitKey, "invite");
    if (!rl.success) {
      throw new StaffServiceError(
        "Too many invite verification attempts. Please wait a few minutes.",
        "RATE_LIMITED"
      );
    }

    const tokenHash = this.hashToken(rawToken.trim());
    const invite = await prisma.staffInvite.findUnique({
      where: { tokenHash },
    });

    if (!invite) {
      throw new StaffServiceError(
        "This staff invitation link is invalid or does not exist.",
        "NOT_FOUND"
      );
    }

    if (invite.usedAt) {
      throw new StaffServiceError(
        "This staff invitation has already been accepted and used.",
        "INVITE_USED"
      );
    }

    if (invite.expiresAt < new Date()) {
      throw new StaffServiceError(
        "This staff invitation has expired. Invitations are valid for 48 hours only.",
        "INVITE_EXPIRED"
      );
    }

    // Security Rule: Accepted only when email matches
    if (sessionUser.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new StaffServiceError(
        `This invitation was issued to ${invite.email}. You are signed in as ${sessionUser.email}. Please sign in with the invited email.`,
        "EMAIL_MISMATCH"
      );
    }

    // Security Rule: Email MUST be verified by provider
    if (!sessionUser.emailVerified) {
      throw new StaffServiceError(
        "Your email address has not been verified by your identity provider. Verified email is required for staff access.",
        "EMAIL_NOT_VERIFIED"
      );
    }

    return prisma.$transaction(async (tx) => {
      // Elevate devotee user to ADMIN role
      const updatedUser = await tx.user.update({
        where: { id: sessionUser.id },
        data: {
          role: "ADMIN",
          isActive: true,
        },
      });

      // Mark invite as used
      await tx.staffInvite.update({
        where: { id: invite.id },
        data: {
          usedAt: new Date(),
        },
      });

      // Immutable Audit Log
      await tx.auditLog.create({
        data: {
          userId: sessionUser.id,
          action: "STAFF_INVITE_ACCEPTED",
          entity: "User",
          entityId: sessionUser.id,
          meta: {
            inviteId: invite.id,
            email: invite.email,
            elevatedToRole: "ADMIN",
          },
          ip,
        },
      });

      return updatedUser;
    });
  },

  /**
   * Lists all administrative staff members.
   */
  async listStaffMembers() {
    return prisma.user.findMany({
      where: { role: "ADMIN" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        isActive: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    });
  },

  /**
   * Lists all staff invitations and their statuses.
   */
  async listStaffInvites() {
    return prisma.staffInvite.findMany({
      include: {
        invitedBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Deactivates a staff member.
   * Security Rules:
   * 1. The last remaining admin cannot be demoted or deactivated.
   * 2. Deactivating one invalidates their sessions immediately.
   * 3. Requires TOTP re-auth for sensitive staff operations.
   */
  async deactivateStaffMember(
    callerAdminId: string,
    targetStaffId: string,
    totpCode?: string,
    ip?: string
  ) {
    // Require TOTP re-auth before staff status modifications (Security Rule 7)
    await this.verifyAdminMfa(callerAdminId, totpCode);

    const target = await prisma.user.findUnique({
      where: { id: targetStaffId },
    });

    if (!target) {
      throw new StaffServiceError("Staff member not found.", "NOT_FOUND");
    }

    if (!target.isActive) {
      return { success: true, message: "Staff member is already inactive." };
    }

    // Security Rule: The last remaining admin cannot be deactivated
    if (target.role === "ADMIN") {
      const activeAdminCount = await prisma.user.count({
        where: { role: "ADMIN", isActive: true },
      });

      if (activeAdminCount <= 1) {
        throw new StaffServiceError(
          "Security Violation: The last remaining active administrator cannot be deactivated or demoted.",
          "LAST_ADMIN"
        );
      }
    }

    // Deactivate user
    await prisma.user.update({
      where: { id: targetStaffId },
      data: { isActive: false },
    });

    // Security Rule: Immediately invalidate all active sessions
    const deletedSessions = await prisma.session.deleteMany({
      where: { userId: targetStaffId },
    });

    // Audit Log
    await logAuditEvent({
      userId: callerAdminId,
      action: "STAFF_DEACTIVATED",
      entity: "User",
      entityId: targetStaffId,
      meta: {
        targetEmail: target.email,
        invalidatedSessions: deletedSessions.count,
      },
      ip,
    });

    return {
      success: true,
      invalidatedSessions: deletedSessions.count,
    };
  },

  /**
   * Reactivates an existing staff member.
   */
  async reactivateStaffMember(
    callerAdminId: string,
    targetStaffId: string,
    totpCode?: string,
    ip?: string
  ) {
    await this.verifyAdminMfa(callerAdminId, totpCode);

    const target = await prisma.user.findUnique({
      where: { id: targetStaffId },
    });

    if (!target) {
      throw new StaffServiceError("Staff member not found.", "NOT_FOUND");
    }

    await prisma.user.update({
      where: { id: targetStaffId },
      data: { isActive: true },
    });

    await logAuditEvent({
      userId: callerAdminId,
      action: "STAFF_ACTIVATED",
      entity: "User",
      entityId: targetStaffId,
      meta: { targetEmail: target.email },
      ip,
    });

    return { success: true };
  },

  /**
   * Demotes a staff member back to devotee USER role.
   * Security Rule: Last remaining admin cannot be demoted. Sessions immediately invalidated.
   */
  async demoteStaffMember(
    callerAdminId: string,
    targetStaffId: string,
    totpCode?: string,
    ip?: string
  ) {
    await this.verifyAdminMfa(callerAdminId, totpCode);

    const target = await prisma.user.findUnique({
      where: { id: targetStaffId },
    });

    if (!target) {
      throw new StaffServiceError("Staff member not found.", "NOT_FOUND");
    }

    if (target.role === "ADMIN" && target.isActive) {
      const activeAdminCount = await prisma.user.count({
        where: { role: "ADMIN", isActive: true },
      });

      if (activeAdminCount <= 1) {
        throw new StaffServiceError(
          "Security Violation: The last remaining active administrator cannot be deactivated or demoted.",
          "LAST_ADMIN"
        );
      }
    }

    await prisma.user.update({
      where: { id: targetStaffId },
      data: { role: "USER" },
    });

    // Invalidate sessions immediately
    await prisma.session.deleteMany({
      where: { userId: targetStaffId },
    });

    await logAuditEvent({
      userId: callerAdminId,
      action: "STAFF_DEMOTED",
      entity: "User",
      entityId: targetStaffId,
      meta: { targetEmail: target.email, newRole: "USER" },
      ip,
    });

    return { success: true };
  },
};
