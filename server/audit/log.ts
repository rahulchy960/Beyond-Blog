import { Prisma, type PrismaClient } from "@prisma/client";
import { isAnalyticsSchemaError } from "@/server/analytics/errors";

type AuditLogInput = {
  db: PrismaClient;
  adminUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown> | null;
};

function normalizeMetadata(
  metadata?: Record<string, unknown> | null,
): Prisma.InputJsonValue | undefined {
  if (!metadata) {
    return undefined;
  }

  return JSON.parse(
    JSON.stringify(metadata, (_key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }

      if (typeof value === "bigint") {
        return value.toString();
      }

      return value;
    }),
  ) as Prisma.InputJsonValue;
}

export async function createAuditLog(input: AuditLogInput) {
  const delegate = (input.db as unknown as { auditLog?: { create?: unknown } }).auditLog;
  if (typeof delegate?.create !== "function") {
    return;
  }

  try {
    const metadata = normalizeMetadata(input.metadata);
    await input.db.auditLog.create({
      data: {
        adminUserId: input.adminUserId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        ...(metadata !== undefined ? { metadata } : {}),
      },
    });
  } catch (error) {
    if (isAnalyticsSchemaError(error)) {
      return;
    }

    console.error("[audit] failed to create audit log", error);
  }
}
