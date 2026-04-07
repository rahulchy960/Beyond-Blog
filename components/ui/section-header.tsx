import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function SectionHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-start md:justify-between", className)}>
      <div className="space-y-2.5">
        {eyebrow ? (
          <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-3xl leading-tight font-semibold tracking-tight md:text-4xl">{title}</h2>
        {description ? (
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-[0.98rem]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2 md:pt-0.5">{actions}</div> : null}
    </div>
  );
}
