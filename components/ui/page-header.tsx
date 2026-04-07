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
    <header className={cn("space-y-5", className)}>
      <div className="flex items-center gap-1 text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">
        <span>{parentLabel}</span>
        <ChevronRightIcon className="size-3.5" />
        <span>{crumb}</span>
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2.5">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight md:text-4xl">{title}</h1>
          {description ? (
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-[0.98rem]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
