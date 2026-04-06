import Link from "next/link";
import { ActivityIcon, PlusIcon } from "lucide-react";
import { AdminStatsGrid } from "@/components/admin/admin-stats-grid";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/lib/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        title="Dashboard"
        description="Single-admin command center for publishing operations, moderation, and editorial health."
      />

      <AnimatedPageWrapper delay={0.03}>
        <AdminStatsGrid />
      </AnimatedPageWrapper>

      <div className="grid gap-5 lg:grid-cols-2">
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
          <Card className="surface-panel h-full">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Create new editorial entries without leaving the dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              <Link href="/admin/journals/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
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
              <Link href="/admin/quizzes" className={buttonVariants({ variant: "outline", size: "sm" })}>
                <PlusIcon className="size-4" />
                New quiz
              </Link>
            </CardContent>
          </Card>
        </AnimatedPageWrapper>
      </div>
    </div>
  );
}
