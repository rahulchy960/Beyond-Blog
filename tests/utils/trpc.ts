import type { inferRouterInputs } from "@trpc/server";
import type { createTRPCContext } from "@/server/api/trpc";
import { appRouter, type AppRouter } from "@/server/api/root";
import { createPrismaMock } from "@/tests/mocks/prisma";

export type RouterInputs = inferRouterInputs<AppRouter>;

type BaseContext = {
  db: ReturnType<typeof createPrismaMock>;
  userId: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;
};

export function createBaseContext(overrides: Partial<BaseContext> = {}) {
  const db = overrides.db ?? createPrismaMock();
  const userId = overrides.userId ?? null;
  const sessionId = overrides.sessionId ?? null;

  return {
    db,
    userId,
    sessionId,
    isAuthenticated: Boolean(userId),
  };
}

export function createAppCaller(overrides: Partial<BaseContext> = {}) {
  const ctx = createBaseContext(overrides);
  return {
    caller: appRouter.createCaller({
      ...ctx,
      db: ctx.db as unknown as Awaited<ReturnType<typeof createTRPCContext>>["db"],
    }),
    ctx,
  };
}
