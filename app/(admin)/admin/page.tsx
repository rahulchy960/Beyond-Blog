import { AdminStatsGrid } from "@/components/admin/admin-stats-grid";
import { SiteContainer } from "@/components/layout/site-container";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboardPage() {
  return (
    <div className="py-10 md:py-14">
      <SiteContainer className="space-y-6">
        <div className="space-y-3">
          <Badge variant="outline">Admin dashboard</Badge>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Beyond Blog control panel
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Initial analytics placeholders are active. Content management modules
            can be added incrementally on this foundation.
          </p>
        </div>

        <AdminStatsGrid />
      </SiteContainer>
    </div>
  );
}
