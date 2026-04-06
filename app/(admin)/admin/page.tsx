import { AdminStatsGrid } from "@/components/admin/admin-stats-grid";
import Link from "next/link";
import { buttonVariants } from "@/lib/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <section className="space-y-3">
        <div className="space-y-3">
          <Badge variant="outline">Editorial overview</Badge>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            Single-admin command center for managing content, media, comments, and
            public quizzes.
          </p>
        </div>
      </section>

      <AdminStatsGrid />

      <Separator />

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Upcoming admin actions and moderation events will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              No activity to show yet.
            </div>
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              Audit trail cards will be connected in the next step.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump directly into core editorial workflows.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <Link href="/admin/journals" className={buttonVariants({ variant: "outline", size: "sm" })}>
              New journal entry
            </Link>
            <Link href="/admin/articles" className={buttonVariants({ variant: "outline", size: "sm" })}>
              New article
            </Link>
            <Link href="/admin/projects" className={buttonVariants({ variant: "outline", size: "sm" })}>
              New project post
            </Link>
            <Link href="/admin/quizzes" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Create quiz
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
