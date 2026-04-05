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

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
