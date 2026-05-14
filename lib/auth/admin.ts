import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { AdminProfile, AdminUser } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { OWNER_ADMIN_ROLE } from "@/lib/auth/constants";
import {
  findAdminByClerkUserId,
  updateAdminProfileById,
} from "@/lib/auth/admin-repository";
import { slugifyText } from "@/lib/content/slug";
import { db } from "@/server/db";
import { getAllowedAdminIds, isAllowedAdmin } from "@/lib/auth/admin-access";

const adminProfileSchema = z.object({
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  imageUrl: z.string().nullable(),
});

export type CurrentAdminContext = {
  adminUser: AdminUser;
  adminProfile: AdminProfile;
};

export { getAllowedAdminIds, isAllowedAdmin };

function fallbackEmailForUser(userId: string) {
  return `${userId}@clerk.local`;
}

function getDisplayName(input: {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}) {
  return `${input.firstName ?? ""} ${input.lastName ?? ""}`.trim() || input.email;
}

async function getUniqueAuthorSlug(displayName: string, adminUserId: string) {
  const base = slugifyText(displayName) || `author-${adminUserId.slice(-6).toLowerCase()}`;
  let slug = base;
  let suffix = 2;

  while (await db.adminProfile.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

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

  // Preserve a manually configured dashboard avatar when present.
  // Fall back to Clerk image only if no custom image has been set yet.
  const persistedImageUrl = admin.imageUrl ?? payload.imageUrl;

  return updateAdminProfileById(admin.id, {
    email: payload.email,
    firstName: payload.firstName,
    lastName: payload.lastName,
    imageUrl: persistedImageUrl,
    lastLoginAt: new Date(),
  });
}

async function getOrCreateAllowedAdmin(options?: {
  syncProfile?: boolean;
}): Promise<AdminUser | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  if (!isAllowedAdmin(userId)) {
    return null;
  }

  let admin = await findAdminByClerkUserId(userId);
  const clerkUser = await currentUser();
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    admin?.email ??
    fallbackEmailForUser(userId);

  if (!admin) {
    admin = await db.adminUser.create({
      data: {
        clerkUserId: userId,
        email,
        firstName: clerkUser?.firstName ?? null,
        lastName: clerkUser?.lastName ?? null,
        imageUrl: clerkUser?.imageUrl ?? null,
        lastLoginAt: new Date(),
        role: OWNER_ADMIN_ROLE,
      },
    });
  }

  if (!admin.isActive || admin.role !== OWNER_ADMIN_ROLE) {
    return null;
  }

  if (options?.syncProfile) {
    return syncAdminProfile(admin);
  }

  return admin;
}

export async function getCurrentAdmin(options?: {
  syncProfile?: boolean;
}): Promise<AdminUser | null> {
  return getOrCreateAllowedAdmin(options);
}

export async function ensureAdminProfile(admin: AdminUser): Promise<AdminProfile> {
  const existing = await db.adminProfile.findUnique({
    where: { clerkUserId: admin.clerkUserId },
  });

  if (existing) {
    return existing;
  }

  const displayName = getDisplayName(admin);
  const slug = await getUniqueAuthorSlug(displayName, admin.id);

  return db.adminProfile.create({
    data: {
      adminUserId: admin.id,
      clerkUserId: admin.clerkUserId,
      displayName,
      slug,
      email: admin.email,
    },
  });
}

export async function getCurrentAdminContext(options?: {
  syncProfile?: boolean;
}): Promise<CurrentAdminContext | null> {
  const adminUser = await getCurrentAdmin(options);

  if (!adminUser) {
    return null;
  }

  const adminProfile = await ensureAdminProfile(adminUser);
  return { adminUser, adminProfile };
}

export async function isAdminUser(clerkUserId?: string | null): Promise<boolean> {
  if (clerkUserId) {
    if (!isAllowedAdmin(clerkUserId)) {
      return false;
    }

    const admin = await findAdminByClerkUserId(clerkUserId);
    return !admin || Boolean(admin.isActive && admin.role === OWNER_ADMIN_ROLE);
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

export async function requireAdminContext(): Promise<CurrentAdminContext> {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const context = await getCurrentAdminContext({ syncProfile: true });

  if (!context) {
    redirect("/unauthorized");
  }

  return context;
}
