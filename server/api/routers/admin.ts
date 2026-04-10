import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
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
    const safeCourseCount = async () => {
      try {
        return await ctx.db.course.count();
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
          return 0;
        }
        throw error;
      }
    };

    const [totalContent, publishedContent, draftContent, totalComments, totalQuizAttempts, totalCourses] =
      await Promise.all([
        ctx.db.content.count(),
        ctx.db.content.count({ where: { publishStatus: "PUBLISHED" } }),
        ctx.db.content.count({ where: { publishStatus: "DRAFT" } }),
        ctx.db.comment.count(),
        ctx.db.quizAttempt.count(),
        safeCourseCount(),
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

