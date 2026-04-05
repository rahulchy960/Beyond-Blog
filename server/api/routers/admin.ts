import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";

export const adminRouter = createTRPCRouter({
  dashboardStats: adminProcedure.query(async ({ ctx }) => {
    const [totalContent, publishedContent, totalComments, publishedQuizzes] =
      await Promise.all([
        ctx.db.content.count(),
        ctx.db.content.count({
          where: { publishStatus: "PUBLISHED" },
        }),
        ctx.db.comment.count(),
        ctx.db.quiz.count({
          where: { status: "PUBLISHED" },
        }),
      ]);

    return [
      {
        title: "Content Entries",
        value: totalContent.toLocaleString(),
        description: "Journals, articles, and projects",
      },
      {
        title: "Published Content",
        value: publishedContent.toLocaleString(),
        description: "Visible to public visitors",
      },
      {
        title: "Public Comments",
        value: totalComments.toLocaleString(),
        description: "Guest discussion activity",
      },
      {
        title: "Published Quizzes",
        value: publishedQuizzes.toLocaleString(),
        description: "Public quiz availability",
      },
    ];
  }),
});
