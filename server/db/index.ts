import "server-only";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaClient } from "@prisma/client";
import ws from "ws";
import { env } from "@/lib/env";

neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const adapter = new PrismaNeon({ connectionString: env.DATABASE_URL });

  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });
};

const hasRequiredDelegates = (client: PrismaClient | undefined): client is PrismaClient => {
  if (!client) {
    return false;
  }

  const checks: Array<[delegateName: string, methodName: string]> = [
    ["adminUser", "findUnique"],
    ["adminProfile", "findUnique"],
    ["content", "findMany"],
    ["category", "findMany"],
    ["tag", "findMany"],
    ["contentTag", "createMany"],
    ["mediaAsset", "create"],
    ["course", "findMany"],
    ["courseSection", "findMany"],
    ["courseLesson", "findMany"],
    ["quiz", "findMany"],
    ["quizQuestion", "findMany"],
    ["quizOption", "findMany"],
    ["quizAnswer", "findMany"],
    ["comment", "count"],
    ["contentLike", "count"],
    ["siteSetting", "findUnique"],
    ["quizAttempt", "count"],
    ["auditLog", "findMany"],
  ];

  const target = client as unknown as Record<string, unknown>;
  return checks.every(([delegateName, methodName]) => {
    const delegate = target[delegateName] as Record<string, unknown> | undefined;
    return typeof delegate?.[methodName] === "function";
  });
};

// During schema changes in dev, a stale global Prisma client can survive HMR.
// Validate required delegates before reusing the cached instance.
const cachedPrisma = globalForPrisma.prisma;
export const db = hasRequiredDelegates(cachedPrisma) ? cachedPrisma : createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

