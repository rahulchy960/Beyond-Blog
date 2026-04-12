import { createTRPCRouter } from "@/server/api/trpc";
import {
  adminRouter,
  analyticsRouter,
  contentRouter,
  courseRouter,
  discoveryRouter,
  interactionRouter,
  mediaRouter,
  profileRouter,
  publicRouter,
  quizRouter,
} from "@/server/api/routers";

export const appRouter = createTRPCRouter({
  public: publicRouter,
  admin: adminRouter,
  analytics: analyticsRouter,
  content: contentRouter,
  course: courseRouter,
  discovery: discoveryRouter,
  interaction: interactionRouter,
  media: mediaRouter,
  profile: profileRouter,
  quiz: quizRouter,
});

export type AppRouter = typeof appRouter;

