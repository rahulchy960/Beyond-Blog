import { createTRPCRouter } from "@/server/api/trpc";
import { adminRouter, publicRouter } from "@/server/api/routers";

export const appRouter = createTRPCRouter({
  public: publicRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
