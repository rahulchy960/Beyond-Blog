import "server-only";
import { appRouter } from "@/server/api/root";
import { createPublicTRPCContext, createTRPCContext } from "@/server/api/trpc";

export async function getServerCaller() {
  const ctx = await createTRPCContext();
  return appRouter.createCaller(ctx);
}

export async function getPublicServerCaller() {
  const ctx = await createPublicTRPCContext();
  return appRouter.createCaller(ctx);
}
