import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaClient } from "@prisma/client";
import ws from "ws";
import { z } from "zod";

neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing DIRECT_URL or DATABASE_URL for Prisma seed.");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({
    connectionString: databaseUrl,
  }),
});

const OWNER_ADMIN_ROLE = "OWNER";

const seedEnvSchema = z.object({
  SINGLE_ADMIN_CLERK_USER_ID: z.string().min(1),
  SINGLE_ADMIN_EMAIL: z.string().email(),
  SINGLE_ADMIN_FIRST_NAME: z.string().min(1).optional(),
  SINGLE_ADMIN_LAST_NAME: z.string().min(1).optional(),
  ALLOW_ADMIN_REASSIGN: z.enum(["true", "false"]).optional(),
});

async function main() {
  const env = seedEnvSchema.parse(process.env);
  const existingOwner = await prisma.adminUser.findUnique({
    where: { role: OWNER_ADMIN_ROLE },
  });

  if (
    existingOwner &&
    existingOwner.clerkUserId !== env.SINGLE_ADMIN_CLERK_USER_ID &&
    env.ALLOW_ADMIN_REASSIGN !== "true"
  ) {
    throw new Error(
      `Owner admin is already assigned to clerkUserId=${existingOwner.clerkUserId}. Set ALLOW_ADMIN_REASSIGN=true to reassign intentionally.`,
    );
  }

  await prisma.adminUser.upsert({
    where: { role: OWNER_ADMIN_ROLE },
    update: {
      clerkUserId: env.SINGLE_ADMIN_CLERK_USER_ID,
      email: env.SINGLE_ADMIN_EMAIL,
      firstName: env.SINGLE_ADMIN_FIRST_NAME ?? null,
      lastName: env.SINGLE_ADMIN_LAST_NAME ?? null,
      isActive: true,
    },
    create: {
      role: OWNER_ADMIN_ROLE,
      clerkUserId: env.SINGLE_ADMIN_CLERK_USER_ID,
      email: env.SINGLE_ADMIN_EMAIL,
      firstName: env.SINGLE_ADMIN_FIRST_NAME ?? null,
      lastName: env.SINGLE_ADMIN_LAST_NAME ?? null,
      isActive: true,
    },
  });

  await prisma.siteSetting.upsert({
    where: { singletonKey: "SITE_SETTINGS" },
    update: {},
    create: {
      singletonKey: "SITE_SETTINGS",
      siteTitle: "Beyond Blog",
      siteSubtitle: "Research, projects, insights, and public learning",
      homepageHeroText:
        "Beyond Blog shares journals, articles, projects, media, and public quizzes.",
      commentModerationEnabled: true,
      defaultQuizShowAnswersAfterSubmit: true,
      defaultQuizAllowMultipleAttempts: true,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
