import type { LucideIcon } from "lucide-react";
import { AlertTriangleIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  details?: string;
  action?: React.ReactNode;
  className?: string;
};

export function ErrorState({
  title,
  description,
  icon: Icon = AlertTriangleIcon,
  details,
  action,
  className,
}: ErrorStateProps) {
  return (
    <Card className={cn("surface-panel border-border/80", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border/70 bg-surface-elevated text-muted-foreground">
            <Icon className="size-4" />
          </span>
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-7 text-muted-foreground">{description}</p>
        {details ? (
          <p className="rounded-md border border-border/70 bg-surface-soft/80 px-3 py-2 text-xs text-muted-foreground">
            {details}
          </p>
        ) : null}
        {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
