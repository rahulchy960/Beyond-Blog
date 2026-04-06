import { createTRPCRouter } from "@/server/api/trpc";
import { adminRouter, contentRouter, publicRouter } from "@/server/api/routers";

export const appRouter = createTRPCRouter({
  public: publicRouter,
  admin: adminRouter,
  content: contentRouter,
});

export type AppRouter = typeof appRouter;
