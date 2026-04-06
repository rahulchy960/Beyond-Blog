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
    <Card className={cn("surface-panel relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="space-y-1">
          <CardDescription className="text-xs tracking-[0.1em] uppercase">{title}</CardDescription>
          <CardTitle className="font-sans text-3xl leading-none font-semibold">{value}</CardTitle>
        </div>
        {Icon ? (
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <Icon className="size-4" />
          </span>
        ) : null}
      </CardHeader>
      {description ? (
        <CardContent className="pt-0 text-sm text-muted-foreground">{description}</CardContent>
      ) : null}
    </Card>
  );
}
