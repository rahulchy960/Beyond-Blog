import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  title: string;
  description?: string;
  value: string;
  icon?: LucideIcon;
  className?: string;
};

export function MetricCard({ title, description, value, icon: Icon, className }: MetricCardProps) {
  return (
    <Card className={cn("surface-panel relative h-full overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1.5">
          <CardDescription className="text-[0.66rem] tracking-[0.16em] uppercase">{title}</CardDescription>
          <CardTitle className="font-sans text-3xl leading-none font-semibold tracking-tight">{value}</CardTitle>
        </div>
        {Icon ? (
          <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border/70 bg-surface-soft text-secondary-foreground">
            <Icon className="size-4.5" />
          </span>
        ) : null}
      </CardHeader>
      {description ? (
        <CardContent className="min-h-14 pt-0 text-sm leading-6 text-muted-foreground">
          {description}
        </CardContent>
      ) : null}
    </Card>
  );
}
