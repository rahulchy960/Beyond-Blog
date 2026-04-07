import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ title, description, icon: Icon, action, className }: EmptyStateProps) {
  return (
    <Card className={cn("surface-inset border-dashed", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          {Icon ? (
            <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border/70 bg-surface-elevated text-muted-foreground">
              <Icon className="size-4" />
            </span>
          ) : null}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-7 text-muted-foreground">{description}</p>
        {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
