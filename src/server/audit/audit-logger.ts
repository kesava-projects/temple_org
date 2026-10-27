import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface LogAuditEventParams {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Prisma.InputJsonValue;
  ip?: string | null;
}

/**
 * Security Rule 9: Append-only audit logger.
 * Logs all administrative creations, updates, deletions, refunds, role changes, and exports.
 */
export async function logAuditEvent({
  userId,
  action,
  entity,
  entityId,
  meta,
  ip,
}: LogAuditEventParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        entity,
        entityId: entityId ?? null,
        meta: meta ?? undefined,
        ip: ip ?? null,
      },
    });
  } catch (error) {
    // Audit logging failure should be recorded and not silently swallowed
    console.error("[AuditLog Failure]", {
      action,
      entity,
      entityId,
      error,
    });
  }
}
