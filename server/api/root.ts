import { createTRPCRouter } from "@/server/api/trpc";
import {
  adminRouter,
  contentRouter,
  courseRouter,
  interactionRouter,
  mediaRouter,
  profileRouter,
  publicRouter,
} from "@/server/api/routers";

export const appRouter = createTRPCRouter({
  public: publicRouter,
  admin: adminRouter,
  content: contentRouter,
  course: courseRouter,
  interaction: interactionRouter,
  media: mediaRouter,
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;

