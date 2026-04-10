import Link from "next/link";
import { ActivityIcon, PlusIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminAvatarSettings } from "@/components/admin/admin-avatar-settings";
import { AdminStatsGrid } from "@/components/admin/admin-stats-grid";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/lib/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const adminLabel = `${admin.firstName ?? ""} ${admin.lastName ?? ""}`.trim() || admin.email;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Single-admin command center for publishing operations, moderation, media, and courses."
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
          <Card className="surface-panel h-full">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Editorial actions, moderation events, and publication updates will appear here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={ActivityIcon}
                title="No recent activity yet"
                description="Once content and moderation events begin, your timeline will surface them here."
              />
            </CardContent>
          </Card>
        </AnimatedPageWrapper>

        <AnimatedPageWrapper delay={0.08}>
          <div className="grid gap-5">
            <AdminAvatarSettings adminLabel={adminLabel} />
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
                <Link href="/admin/quizzes" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <PlusIcon className="size-4" />
                  New quiz
                </Link>
              </CardContent>
            </Card>
          </div>
        </AnimatedPageWrapper>
      </div>
    </div>
  );
}

