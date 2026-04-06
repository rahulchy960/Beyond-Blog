import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { AdminUser } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { OWNER_ADMIN_ROLE } from "@/lib/auth/constants";
import {
  findAdminByClerkUserId,
  updateAdminProfileById,
} from "@/lib/auth/admin-repository";

const adminProfileSchema = z.object({
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  imageUrl: z.string().nullable(),
});

async function syncAdminProfile(admin: AdminUser): Promise<AdminUser> {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return admin;
  }

  const primaryEmail =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress;

  if (!primaryEmail) {
    return admin;
  }

  const payload = adminProfileSchema.parse({
    email: primaryEmail,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    imageUrl: clerkUser.imageUrl ?? null,
  });

  return updateAdminProfileById(admin.id, {
    email: payload.email,
    firstName: payload.firstName,
    lastName: payload.lastName,
    imageUrl: payload.imageUrl,
    lastLoginAt: new Date(),
  });
}

export async function getCurrentAdmin(options?: {
  syncProfile?: boolean;
}): Promise<AdminUser | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const admin = await findAdminByClerkUserId(userId);

  if (!admin || !admin.isActive || admin.role !== OWNER_ADMIN_ROLE) {
    return null;
  }

  if (options?.syncProfile) {
    return syncAdminProfile(admin);
  }

  return admin;
}

export async function isAdminUser(clerkUserId?: string | null): Promise<boolean> {
  if (clerkUserId) {
    const admin = await findAdminByClerkUserId(clerkUserId);
    return Boolean(admin && admin.isActive && admin.role === OWNER_ADMIN_ROLE);
  }

  const admin = await getCurrentAdmin();
  return Boolean(admin);
}

export async function requireAdmin(): Promise<AdminUser> {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const admin = await getCurrentAdmin({ syncProfile: true });

  if (!admin) {
    redirect("/unauthorized");
  }

  return admin;
}
