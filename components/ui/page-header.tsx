import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  parentLabel?: string;
  currentLabel?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  parentLabel = "Admin",
  currentLabel,
  actions,
  className,
}: PageHeaderProps) {
  const crumb = currentLabel ?? title;

  return (
    <header className={cn("space-y-4", className)}>
      <div className="flex items-center gap-1 text-xs tracking-wide text-muted-foreground uppercase">
        <span>{parentLabel}</span>
        <ChevronRightIcon className="size-3.5" />
        <span>{crumb}</span>
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
          {description ? <p className="max-w-3xl text-sm text-muted-foreground md:text-base">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
