import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";

export const adminRouter = createTRPCRouter({
  dashboardStats: adminProcedure.query(async ({ ctx }) => {
    const [totalUsers, adminUsers] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.user.count({
        where: { role: "ADMIN" },
      }),
    ]);

    return [
      {
        title: "Total Users",
        value: totalUsers.toLocaleString(),
        description: "Synced from Clerk identities",
      },
      {
        title: "Admin Users",
        value: adminUsers.toLocaleString(),
        description: "Authorized faculty administrators",
      },
      {
        title: "Published Collections",
        value: "0",
        description: "Journals, projects, and articles (placeholder)",
      },
      {
        title: "Assessment Modules",
        value: "0",
        description: "Quiz engine modules (placeholder)",
      },
    ];
  }),
});
