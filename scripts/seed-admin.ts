import "dotenv/config";

import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { AdminRole, PrismaClient } from "@prisma/client";
import ws from "ws";
import { z } from "zod";

neonConfig.webSocketConstructor = ws;

const envSchema = z.object({
  DATABASE_URL: z.string().trim().min(1).optional(),
  DIRECT_URL: z.string().trim().min(1).optional(),
  SINGLE_ADMIN_CLERK_USER_ID: z.string().trim().min(1).optional(),
  SINGLE_ADMIN_EMAIL: z.string().trim().email().optional(),
  ALLOWED_ADMIN_IDS: z.string().trim().min(1).optional(),
  ALLOWED_ADMIN_EMAILS: z.string().trim().min(1).optional(),
});

function splitEnvList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function slugFromEmail(email: string) {
  const localPart = email.split("@")[0] ?? "admin";
  const slug = localPart
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "admin";
}

function displayNameFromEmail(email: string) {
  return email.split("@")[0] || "admin";
}

function resolveAdminIdentity(env: z.infer<typeof envSchema>) {
  if (env.SINGLE_ADMIN_CLERK_USER_ID && env.SINGLE_ADMIN_EMAIL) {
    return {
      clerkUserId: env.SINGLE_ADMIN_CLERK_USER_ID,
      email: env.SINGLE_ADMIN_EMAIL,
    };
  }

  const allowedAdminIds = splitEnvList(env.ALLOWED_ADMIN_IDS);
  const allowedAdminEmails = splitEnvList(env.ALLOWED_ADMIN_EMAILS);
  const firstAllowedEmail = allowedAdminEmails[0];

  if (allowedAdminIds[0] && firstAllowedEmail) {
    const email = z.string().email().parse(firstAllowedEmail);
    return {
      clerkUserId: allowedAdminIds[0],
      email,
    };
  }

  throw new Error(
    "Missing admin identity. Provide SINGLE_ADMIN_CLERK_USER_ID and SINGLE_ADMIN_EMAIL, or ALLOWED_ADMIN_IDS and ALLOWED_ADMIN_EMAILS.",
  );
}

async function getUniqueSlug(
  prisma: PrismaClient,
  baseSlug: string,
  existingProfileId?: string,
) {
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.adminProfile.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || existing.id === existingProfileId) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function main() {
  const env = envSchema.parse(process.env);
  const databaseUrl = env.DIRECT_URL ?? env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing DIRECT_URL or DATABASE_URL.");
  }

  const adminIdentity = resolveAdminIdentity(env);
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({
      connectionString: databaseUrl,
    }),
  });

  try {
    const matchingAdmins = await prisma.adminUser.findMany({
      where: {
        OR: [
          { clerkUserId: adminIdentity.clerkUserId },
          { email: adminIdentity.email },
        ],
      },
      select: { id: true },
    });

    const uniqueAdminIds = new Set(matchingAdmins.map((admin) => admin.id));
    if (uniqueAdminIds.size > 1) {
      throw new Error(
        "Refusing to seed admin because clerkUserId and email match different AdminUser records.",
      );
    }

    const existingAdminId = matchingAdmins[0]?.id;
    const adminUser = existingAdminId
      ? await prisma.adminUser.update({
          where: { id: existingAdminId },
          data: {
            clerkUserId: adminIdentity.clerkUserId,
            email: adminIdentity.email,
            isActive: true,
            role: AdminRole.OWNER,
          },
        })
      : await prisma.adminUser.create({
          data: {
            clerkUserId: adminIdentity.clerkUserId,
            email: adminIdentity.email,
            isActive: true,
            role: AdminRole.OWNER,
          },
        });

    const existingProfile = await prisma.adminProfile.findFirst({
      where: {
        OR: [
          { adminUserId: adminUser.id },
          { clerkUserId: adminIdentity.clerkUserId },
        ],
      },
      select: { id: true },
    });

    const baseSlug = slugFromEmail(adminIdentity.email);
    const slug = await getUniqueSlug(prisma, baseSlug, existingProfile?.id);
    const displayName = displayNameFromEmail(adminIdentity.email);

    const adminProfile = existingProfile
      ? await prisma.adminProfile.update({
          where: { id: existingProfile.id },
          data: {
            adminUserId: adminUser.id,
            clerkUserId: adminIdentity.clerkUserId,
            displayName,
            slug,
            email: adminIdentity.email,
          },
        })
      : await prisma.adminProfile.create({
          data: {
            adminUserId: adminUser.id,
            clerkUserId: adminIdentity.clerkUserId,
            displayName,
            slug,
            email: adminIdentity.email,
          },
        });

    console.log("Admin seed completed.");
    console.log(`AdminUser: ${adminUser.id}`);
    console.log(`AdminProfile: ${adminProfile.id}`);
    console.log(`Email: ${adminIdentity.email}`);
    console.log(`Clerk user ID: ${adminIdentity.clerkUserId}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error("Admin seed failed:", error);
  process.exit(1);
});
