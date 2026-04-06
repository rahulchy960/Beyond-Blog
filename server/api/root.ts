import { createTRPCRouter } from "@/server/api/trpc";
import { adminRouter, contentRouter, mediaRouter, publicRouter } from "@/server/api/routers";

export const appRouter = createTRPCRouter({
  public: publicRouter,
  admin: adminRouter,
  content: contentRouter,
  media: mediaRouter,
});

export type AppRouter = typeof appRouter;
