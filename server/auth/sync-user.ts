import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import type { User } from "@prisma/client";
import { db } from "@/server/db";
import { z } from "zod";

const userSyncSchema = z.object({
  clerkUserId: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  imageUrl: z.string().nullable(),
});

export async function syncCurrentUser(): Promise<User | null> {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const primaryEmail =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress;

  if (!primaryEmail) {
    return null;
  }

  const syncPayload = userSyncSchema.parse({
    clerkUserId: clerkUser.id,
    email: primaryEmail,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    imageUrl: clerkUser.imageUrl ?? null,
  });

  return db.user.upsert({
    where: { clerkUserId: syncPayload.clerkUserId },
    create: syncPayload,
    update: {
      email: syncPayload.email,
      firstName: syncPayload.firstName,
      lastName: syncPayload.lastName,
      imageUrl: syncPayload.imageUrl,
    },
  });
}

export async function getDatabaseUserByClerkId(
  clerkUserId: string,
): Promise<User | null> {
  return db.user.findUnique({
    where: { clerkUserId },
  });
}
