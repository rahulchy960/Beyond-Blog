import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const publicRouter = createTRPCRouter({
  platformOverview: publicProcedure.query(() => {
    return {
      title: "Academic Content Platform",
      subtitle:
        "A scalable foundation for journals, projects, articles, media, and quizzes.",
    };
  }),
  greetVisitor: publicProcedure
    .input(
      z.object({
        name: z.string().trim().min(2).max(80),
      }),
    )
    .query(({ input }) => {
      return {
        message: `Welcome, ${input.name}.`,
      };
    }),
});
