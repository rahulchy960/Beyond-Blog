import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import { findAdminById, updateAdminImageUrlById } from "@/lib/auth/admin-repository";
import { getDashboardSummary } from "@/server/analytics/service";
import { createAuditLog } from "@/server/audit/log";

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
      authorProfile: {
        id: ctx.adminProfile.id,
        displayName: ctx.adminProfile.displayName,
        slug: ctx.adminProfile.slug,
      },
    };
  }),

  dashboardStats: adminProcedure.query(async ({ ctx }) => {
    const summary = await getDashboardSummary(ctx.db);

    return [
      {
        title: "Total Content",
        value: summary.metrics.totalContent.toLocaleString(),
        description: "Journals, articles, and projects combined",
      },
      {
        title: "Published Content",
        value: summary.metrics.publishedContent.toLocaleString(),
        description: "Visible to public visitors",
      },
      {
        title: "Draft Content",
        value: summary.metrics.draftContent.toLocaleString(),
        description: "Pending editorial review",
      },
      {
        title: "Courses",
        value: summary.metrics.totalCourses.toLocaleString(),
        description: "Structured learning tracks",
      },
      {
        title: "Total Comments",
        value: summary.metrics.visibleComments.toLocaleString(),
        description: "Visible guest comments across published content",
      },
      {
        title: "Pending Comments",
        value: summary.metrics.pendingComments.toLocaleString(),
        description: "Awaiting moderation review",
      },
      {
        title: "Total Likes",
        value: summary.metrics.totalLikes.toLocaleString(),
        description: "Anonymous likes from public visitors",
      },
      {
        title: "Total Quiz Attempts",
        value: summary.metrics.totalQuizAttempts.toLocaleString(),
        description: "Guest quiz submissions",
      },
      {
        title: "Total Quizzes",
        value: summary.metrics.totalQuizzes.toLocaleString(),
        description: "Draft, published, and closed quizzes",
      },
    ];
  }),

  updateAvatar: adminProcedure
    .input(updateAdminAvatarInputSchema)
    .mutation(async ({ ctx, input }) => {
      const normalized = input.imageUrl?.trim() ? input.imageUrl.trim() : null;
      const updated = await updateAdminImageUrlById(ctx.adminUser.id, normalized);
      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "admin.avatar.update",
        entityType: "ADMIN_USER",
        entityId: ctx.adminUser.id,
        metadata: {
          imageUrl: updated.imageUrl,
        },
      });

      return {
        id: updated.id,
        imageUrl: updated.imageUrl,
      };
    }),
});
