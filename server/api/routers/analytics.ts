import {
  analyticsDetailInputSchema,
  listAuditLogsInputSchema,
  recentActivityInputSchema,
  topPerformingInputSchema,
} from "@/lib/analytics/schemas";
import {
  getAnalyticsDetail,
  getDashboardSummary,
  getRecentActivityFeed,
  getTopPerformingContent,
  listAuditLogs,
} from "@/server/analytics/service";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";

export const analyticsRouter = createTRPCRouter({
  getDashboardSummary: adminProcedure.query(async ({ ctx }) => {
    return getDashboardSummary(ctx.db);
  }),

  getAnalyticsDetail: adminProcedure
    .input(analyticsDetailInputSchema)
    .query(async ({ ctx, input }) => {
      return getAnalyticsDetail(ctx.db, input.timeRange);
    }),

  getTopPerforming: adminProcedure
    .input(topPerformingInputSchema)
    .query(async ({ ctx, input }) => {
      return getTopPerformingContent(ctx.db, input);
    }),

  getRecentActivityFeed: adminProcedure
    .input(recentActivityInputSchema)
    .query(async ({ ctx, input }) => {
      return getRecentActivityFeed(ctx.db, input.limit);
    }),

  listAuditLogs: adminProcedure
    .input(listAuditLogsInputSchema)
    .query(async ({ ctx, input }) => {
      return listAuditLogs(ctx.db, input);
    }),
});

