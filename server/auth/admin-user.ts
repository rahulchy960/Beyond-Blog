import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { AdminRole, type AdminUser } from "@prisma/client";
import { z } from "zod";
import { db } from "@/server/db";

const adminSyncSchema = z.object({
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  imageUrl: z.string().nullable(),
});

export async function getOwnerAdminUser(): Promise<AdminUser | null> {
  return db.adminUser.findUnique({
    where: { role: AdminRole.OWNER },
  });
}

export async function getAdminByClerkUserId(
  clerkUserId: string,
): Promise<AdminUser | null> {
  return db.adminUser.findUnique({
    where: { clerkUserId },
  });
}

export async function syncSignedInAdminUser(): Promise<AdminUser | null> {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const owner = await getOwnerAdminUser();

  if (!owner || owner.clerkUserId !== clerkUser.id) {
    return null;
  }

  const primaryEmail =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress;

  if (!primaryEmail) {
    return null;
  }

  const payload = adminSyncSchema.parse({
    email: primaryEmail,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    imageUrl: clerkUser.imageUrl ?? null,
  });

  return db.adminUser.update({
    where: { id: owner.id },
    data: {
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      imageUrl: payload.imageUrl,
      lastLoginAt: new Date(),
      isActive: true,
    },
  });
}
