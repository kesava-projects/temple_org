import { describe, it, expect, vi, beforeEach } from "vitest";
import { staffService, StaffServiceError } from "@/server/staff/staff.service";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/server/audit/audit-logger";
import { communications } from "@/server/notifications/communications";
import type { User, StaffInvite } from "@prisma/client";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    staffInvite: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    twoFactor: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn((callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma)),
  },
}));

vi.mock("@/server/audit/audit-logger", () => ({
  logAuditEvent: vi.fn(),
}));

vi.mock("@/server/notifications/communications", () => ({
  communications: {
    sendStaffInviteEmail: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe("Staff Governance & Security Service (staff.service.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createStaffInvite (Security Rule: 48h, Token Hash, Admin Only)", () => {
    it("should reject invitation if caller is not an ADMIN", async () => {
      const devoteeCaller = { id: "user-1", role: "USER", name: "Devotee" };

      await expect(
        staffService.createStaffInvite(devoteeCaller, { email: "newstaff@temple.org" })
      ).rejects.toThrowError(StaffServiceError);
    });

    it("should reject invitation if invited email is already an active admin", async () => {
      const adminCaller = { id: "admin-1", role: "ADMIN", name: "Chief Priest" };
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
        id: "existing-admin",
        email: "existing@temple.org",
        role: "ADMIN",
        isActive: true,
      } as unknown as User);

      await expect(
        staffService.createStaffInvite(adminCaller, { email: "existing@temple.org" })
      ).rejects.toThrow("already an active administrator");
    });

    it("should generate 48-hour expiration and store SHA-256 token hash", async () => {
      const adminCaller = { id: "admin-1", role: "ADMIN", name: "Chief Priest" };
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);

      const fakeInvite: Partial<StaffInvite> = {
        id: "invite-123",
        email: "newpriest@temple.org",
        tokenHash: "hashed-token",
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      };
      vi.mocked(prisma.staffInvite.upsert).mockResolvedValueOnce(fakeInvite as StaffInvite);

      const result = await staffService.createStaffInvite(adminCaller, {
        email: "newpriest@temple.org",
      });

      expect(result.rawToken).toBeDefined();
      expect(result.rawToken.length).toBe(64); // 32 bytes hex
      expect(prisma.staffInvite.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: "newpriest@temple.org" },
        })
      );
      expect(communications.sendStaffInviteEmail).toHaveBeenCalledTimes(1);
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "STAFF_INVITE_CREATED",
          entity: "StaffInvite",
          entityId: "invite-123",
        })
      );
    });
  });

  describe("getStaffInviteByToken (Validation & Expiration Checks)", () => {
    it("should return valid invite for active unexpired token", async () => {
      const rawToken = "sample-raw-token-12345";
      const expectedHash = staffService.hashToken(rawToken);

      vi.mocked(prisma.staffInvite.findUnique).mockResolvedValueOnce({
        id: "invite-1",
        email: "pandit@temple.org",
        tokenHash: expectedHash,
        expiresAt: new Date(Date.now() + 100000),
        usedAt: null,
      } as unknown as StaffInvite);

      const res = await staffService.getStaffInviteByToken(rawToken);
      expect(res.valid).toBe(true);
      expect(res.invite?.email).toBe("pandit@temple.org");
    });

    it("should mark invite as EXPIRED if beyond 48 hours", async () => {
      const rawToken = "expired-token-12345";
      vi.mocked(prisma.staffInvite.findUnique).mockResolvedValueOnce({
        id: "invite-1",
        email: "pandit@temple.org",
        tokenHash: staffService.hashToken(rawToken),
        expiresAt: new Date(Date.now() - 1000), // Expired
        usedAt: null,
      } as unknown as StaffInvite);

      const res = await staffService.getStaffInviteByToken(rawToken);
      expect(res.valid).toBe(false);
      expect(res.reason).toBe("INVITE_EXPIRED");
    });

    it("should mark invite as USED if already claimed", async () => {
      const rawToken = "used-token-12345";
      vi.mocked(prisma.staffInvite.findUnique).mockResolvedValueOnce({
        id: "invite-1",
        email: "pandit@temple.org",
        tokenHash: staffService.hashToken(rawToken),
        expiresAt: new Date(Date.now() + 100000),
        usedAt: new Date(), // Already used
      } as unknown as StaffInvite);

      const res = await staffService.getStaffInviteByToken(rawToken);
      expect(res.valid).toBe(false);
      expect(res.reason).toBe("INVITE_USED");
    });
  });

  describe("acceptStaffInvite (Security Rule: Verified Email Matching Only)", () => {
    it("should reject acceptance if signed-in email does not match invited email", async () => {
      const rawToken = "token-matching-check";
      vi.mocked(prisma.staffInvite.findUnique).mockResolvedValueOnce({
        id: "invite-1",
        email: "correct@temple.org",
        expiresAt: new Date(Date.now() + 100000),
        usedAt: null,
      } as unknown as StaffInvite);

      const wrongUser = {
        id: "user-attacker",
        email: "wrong@gmail.com",
        emailVerified: true,
      };

      await expect(
        staffService.acceptStaffInvite(rawToken, wrongUser)
      ).rejects.toThrow("Please sign in with the invited email");
    });

    it("should reject acceptance if OAuth provider has NOT verified email", async () => {
      const rawToken = "token-verification-check";
      vi.mocked(prisma.staffInvite.findUnique).mockResolvedValueOnce({
        id: "invite-1",
        email: "pandit@temple.org",
        expiresAt: new Date(Date.now() + 100000),
        usedAt: null,
      } as unknown as StaffInvite);

      const unverifiedUser = {
        id: "user-pandit",
        email: "pandit@temple.org",
        emailVerified: false, // NOT verified by provider
      };

      await expect(
        staffService.acceptStaffInvite(rawToken, unverifiedUser)
      ).rejects.toThrow("Verified email is required");
    });

    it("should elevate role to ADMIN and mark invite used when email is verified and matching", async () => {
      const rawToken = "valid-token-pandit";
      vi.mocked(prisma.staffInvite.findUnique).mockResolvedValueOnce({
        id: "invite-1",
        email: "pandit@temple.org",
        expiresAt: new Date(Date.now() + 100000),
        usedAt: null,
      } as unknown as StaffInvite);

      vi.mocked(prisma.user.update).mockResolvedValueOnce({
        id: "user-pandit",
        email: "pandit@temple.org",
        role: "ADMIN",
        isActive: true,
      } as unknown as User);

      const verifiedUser = {
        id: "user-pandit",
        email: "pandit@temple.org",
        emailVerified: true,
      };

      const result = await staffService.acceptStaffInvite(rawToken, verifiedUser);
      expect(result.role).toBe("ADMIN");
      expect(prisma.staffInvite.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "invite-1" },
          data: expect.objectContaining({ usedAt: expect.any(Date) }),
        })
      );
    });
  });

  describe("deactivateStaffMember (Security Rules: Last-Admin Protection & Session Invalidation)", () => {
    it("should block deactivation of the last remaining active admin", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "sole-admin",
        email: "sole@temple.org",
        role: "ADMIN",
        isActive: true,
      } as unknown as User);

      // Only 1 active admin exists
      vi.mocked(prisma.user.count).mockResolvedValueOnce(1);

      await expect(
        staffService.deactivateStaffMember("sole-admin", "sole-admin")
      ).rejects.toThrow("The last remaining active administrator cannot be deactivated");
    });

    it("should allow deactivation when other active admins exist and immediately invalidate all sessions", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "admin-to-deactivate",
        email: "staff2@temple.org",
        role: "ADMIN",
        isActive: true,
      } as unknown as User);

      // 2 active admins exist
      vi.mocked(prisma.user.count).mockResolvedValueOnce(2);
      vi.mocked(prisma.session.deleteMany).mockResolvedValueOnce({ count: 3 });

      const res = await staffService.deactivateStaffMember("super-admin", "admin-to-deactivate");
      expect(res.success).toBe(true);
      expect(res.invalidatedSessions).toBe(3);

      // Check user updated to inactive
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "admin-to-deactivate" },
        data: { isActive: false },
      });

      // Check sessions purged immediately
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: "admin-to-deactivate" },
      });

      // Check AuditLog recorded
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "STAFF_DEACTIVATED",
          entity: "User",
          entityId: "admin-to-deactivate",
        })
      );
    });
  });

  describe("demoteStaffMember (Security Rule: Last-Admin Demotion Guard)", () => {
    it("should prevent demoting the sole active admin", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "sole-admin",
        email: "sole@temple.org",
        role: "ADMIN",
        isActive: true,
      } as unknown as User);

      vi.mocked(prisma.user.count).mockResolvedValueOnce(1);

      await expect(
        staffService.demoteStaffMember("sole-admin", "sole-admin")
      ).rejects.toThrow("The last remaining active administrator cannot be deactivated or demoted");
    });
  });
});
