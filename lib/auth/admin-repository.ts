import "server-only";
import type { AdminUser, PrismaClient } from "@prisma/client";
import { db } from "@/server/db";

type AdminUserDelegate = PrismaClient["adminUser"];

let hasLoggedDelegateFallback = false;

function getAdminDelegate(): AdminUserDelegate | null {
  const maybeDelegate = (db as unknown as { adminUser?: AdminUserDelegate }).adminUser;
  return maybeDelegate ?? null;
}

function logDelegateFallback(reason: string) {
  if (!hasLoggedDelegateFallback) {
    hasLoggedDelegateFallback = true;
    console.error(
      `[auth] Prisma adminUser delegate unavailable at runtime (${reason}). Falling back to raw SQL auth queries.`,
    );
  }
}

export async function findAdminByClerkUserId(
  clerkUserId: string,
): Promise<AdminUser | null> {
  const delegate = getAdminDelegate();

  if (delegate) {
    return delegate.findUnique({
      where: {
        clerkUserId,
      },
    });
  }

  logDelegateFallback("findAdminByClerkUserId");

  const rows = await db.$queryRaw<AdminUser[]>`
    SELECT
      "id",
      "clerkUserId",
      "email",
      "firstName",
      "lastName",
      "imageUrl",
      "isActive",
      "lastLoginAt",
      "role",
      "createdAt",
      "updatedAt"
    FROM "AdminUser"
    WHERE "clerkUserId" = ${clerkUserId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function updateAdminProfileById(
  adminId: string,
  data: Pick<AdminUser, "email" | "firstName" | "lastName" | "imageUrl"> & {
    lastLoginAt: Date;
  },
): Promise<AdminUser> {
  const delegate = getAdminDelegate();

  if (delegate) {
    return delegate.update({
      where: { id: adminId },
      data,
    });
  }

  logDelegateFallback("updateAdminProfileById");

  const rows = await db.$queryRaw<AdminUser[]>`
    UPDATE "AdminUser"
    SET
      "email" = ${data.email},
      "firstName" = ${data.firstName},
      "lastName" = ${data.lastName},
      "imageUrl" = ${data.imageUrl},
      "lastLoginAt" = ${data.lastLoginAt},
      "updatedAt" = NOW()
    WHERE "id" = ${adminId}
    RETURNING
      "id",
      "clerkUserId",
      "email",
      "firstName",
      "lastName",
      "imageUrl",
      "isActive",
      "lastLoginAt",
      "role",
      "createdAt",
      "updatedAt"
  `;

  const updated = rows[0];
  if (!updated) {
    throw new Error("Failed to update admin profile: admin not found.");
  }

  return updated;
}
