import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { COMMENT_STATUS, type CommentStatus } from "@/lib/content/enums";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import { findAdminById, updateAdminImageUrlById } from "@/lib/auth/admin-repository";

const updateAdminAvatarInputSchema = z.object({
  imageUrl: z.string().trim().url().max(2000).optional().nullable(),
});

export const adminRouter = createTRPCRouter({
  getProfile: adminProcedure.query(async ({ ctx }) => {
    const admin = await findAdminById(ctx.adminUser.id);
    if (!admin) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Admin profile not found.",
      });
    }

    return {
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      imageUrl: admin.imageUrl,
    };
  }),

  dashboardStats: adminProcedure.query(async ({ ctx }) => {
    const hasPendingCommentStatus = async () => {
      try {
        const rows = await ctx.db.$queryRaw<Array<{ exists: boolean }>>`
          SELECT EXISTS (
            SELECT 1
            FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            WHERE t.typname = 'CommentStatus'
              AND e.enumlabel = 'PENDING'
          ) AS "exists"
        `;

        return rows[0]?.exists ?? false;
      } catch {
        return false;
      }
    };

    const isLegacyInteractionSchemaError = (error: unknown) => {
      const message = String(error ?? "");
      if (message.includes('invalid input value for enum "CommentStatus"')) {
        return true;
      }
      if (
        message.includes("does not exist in the current database") ||
        message.includes("The column `(not available)` does not exist") ||
        (message.includes("column") && message.includes("does not exist"))
      ) {
        return true;
      }

      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
        return false;
      }

      if (error.code === "P2021" || error.code === "P2022") {
        return true;
      }

      if (error.code === "P2010") {
        const text = String(error.message);
        return (
          text.includes("Comment") ||
          text.includes("ContentLike") ||
          text.includes("commentStatus") ||
          text.includes("CommentStatus")
        );
      }

      return false;
    };

    const safeCourseCount = async () => {
      try {
        return await ctx.db.course.count();
      } catch (error) {
        if (isLegacyInteractionSchemaError(error)) {
          return 0;
        }
        throw error;
      }
    };

    const safeLikeCount = async () => {
      try {
        return await ctx.db.contentLike.count();
      } catch (error) {
        if (isLegacyInteractionSchemaError(error)) {
          return 0;
        }
        throw error;
      }
    };

    const safeCommentCount = async (status: CommentStatus, pendingSupported: boolean) => {
      if (status === COMMENT_STATUS.PENDING && !pendingSupported) {
        return 0;
      }

      try {
        return await ctx.db.comment.count({ where: { status } });
      } catch (error) {
        if (isLegacyInteractionSchemaError(error)) {
          return 0;
        }
        throw error;
      }
    };

    const pendingSupported = await hasPendingCommentStatus();

    const safeQuizCount = async () => {
      try {
        return await ctx.db.quiz.count();
      } catch (error) {
        if (isLegacyInteractionSchemaError(error)) {
          return 0;
        }
        throw error;
      }
    };

    const [
      totalContent,
      publishedContent,
      draftContent,
      totalVisibleComments,
      pendingComments,
      totalQuizAttempts,
      totalQuizzes,
      totalCourses,
      totalLikes,
    ] =
      await Promise.all([
        ctx.db.content.count(),
        ctx.db.content.count({ where: { publishStatus: "PUBLISHED" } }),
        ctx.db.content.count({ where: { publishStatus: "DRAFT" } }),
        safeCommentCount(COMMENT_STATUS.VISIBLE, pendingSupported),
        safeCommentCount(COMMENT_STATUS.PENDING, pendingSupported),
        ctx.db.quizAttempt.count(),
        safeQuizCount(),
        safeCourseCount(),
        safeLikeCount(),
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
        title: "Courses",
        value: totalCourses.toLocaleString(),
        description: "Structured learning tracks",
      },
      {
        title: "Total Comments",
        value: totalVisibleComments.toLocaleString(),
        description: "Visible guest comments across published content",
      },
      {
        title: "Pending Comments",
        value: pendingComments.toLocaleString(),
        description: "Awaiting moderation review",
      },
      {
        title: "Total Likes",
        value: totalLikes.toLocaleString(),
        description: "Anonymous likes from public visitors",
      },
      {
        title: "Total Quiz Attempts",
        value: totalQuizAttempts.toLocaleString(),
        description: "Guest quiz submissions",
      },
      {
        title: "Total Quizzes",
        value: totalQuizzes.toLocaleString(),
        description: "Draft, published, and closed quizzes",
      },
    ];
  }),

  updateAvatar: adminProcedure
    .input(updateAdminAvatarInputSchema)
    .mutation(async ({ ctx, input }) => {
      const normalized = input.imageUrl?.trim() ? input.imageUrl.trim() : null;
      const updated = await updateAdminImageUrlById(ctx.adminUser.id, normalized);

      return {
        id: updated.id,
        imageUrl: updated.imageUrl,
      };
    }),
});

