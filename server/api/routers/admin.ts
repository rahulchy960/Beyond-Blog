import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";

export const adminRouter = createTRPCRouter({
  dashboardStats: adminProcedure.query(async ({ ctx }) => {
    const [totalContent, publishedContent, draftContent, totalComments, totalQuizAttempts] =
      await Promise.all([
        ctx.db.content.count(),
        ctx.db.content.count({
          where: { publishStatus: "PUBLISHED" },
        }),
        ctx.db.content.count({
          where: { publishStatus: "DRAFT" },
        }),
        ctx.db.comment.count(),
        ctx.db.quizAttempt.count(),
      ]);

    return [
      {
        title: "Total Content",
        value: totalContent.toLocaleString(),
        description: "Journals, articles, and projects combined",
      },
      {
        title: "Published Content",
        value: publishedContent.toLocaleString(),
        description: "Visible to public visitors",
      },
      {
        title: "Draft Content",
        value: draftContent.toLocaleString(),
        description: "Pending editorial review",
      },
      {
        title: "Total Comments",
        value: totalComments.toLocaleString(),
        description: "Guest comments across published content",
      },
      {
        title: "Total Quiz Attempts",
        value: totalQuizAttempts.toLocaleString(),
        description: "Guest quiz submissions",
      },
    ];
  }),
});
