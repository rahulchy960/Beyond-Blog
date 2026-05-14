import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { requireAdminContext } from "@/lib/auth/admin";
import { db } from "@/server/db";
import { AdminAvatarSettings } from "@/components/admin/admin-avatar-settings";
import { AdminInteractionInsights } from "@/components/admin/admin-interaction-insights";
import { AdminStatsGrid } from "@/components/admin/admin-stats-grid";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/lib/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const { adminProfile } = await requireAdminContext();
  const [authoredContentCount, authoredCoursesCount] = await Promise.all([
    db.content.count({ where: { authorId: adminProfile.id } }),
    db.course.count({ where: { authorId: adminProfile.id } }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`Signed in as ${adminProfile.displayName}. ${authoredContentCount} authored entries and ${authoredCoursesCount} authored courses.`}
        actions={
          <>
            <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Home
            </Link>
            <Link href="/admin" className={buttonVariants({ size: "sm" })}>
              Dashboard
            </Link>
          </>
        }
      />

      <AnimatedPageWrapper delay={0.03}>
        <AdminStatsGrid />
      </AnimatedPageWrapper>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <AnimatedPageWrapper delay={0.06}>
          <AdminInteractionInsights />
        </AnimatedPageWrapper>

        <AnimatedPageWrapper delay={0.08}>
            <div className="grid gap-5">
            <AdminAvatarSettings adminLabel={adminProfile.displayName} />
            <Card className="surface-panel h-full">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Create and route new entries quickly.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Link href="/admin/journals/new" className={buttonVariants({ size: "sm" })}>
                  <PlusIcon className="size-4" />
                  New journal
                </Link>
                <Link href="/admin/articles/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <PlusIcon className="size-4" />
                  New article
                </Link>
                <Link href="/admin/projects/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <PlusIcon className="size-4" />
                  New project
                </Link>
                <Link href="/admin/courses/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <PlusIcon className="size-4" />
                  New course
                </Link>
                <Link href="/admin/quizzes/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <PlusIcon className="size-4" />
                  New quiz
                </Link>
                <Link href="/admin/analytics" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Analytics insights
                </Link>
                <Link href="/admin/audit-logs" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Audit log stream
                </Link>
              </CardContent>
            </Card>
          </div>
        </AnimatedPageWrapper>
      </div>
    </div>
  );
}
