import { Badge } from "@/components/ui/badge";

type TaxonomyHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string | null;
  count?: number;
};

export function TaxonomyHeader({ eyebrow, title, description, count }: TaxonomyHeaderProps) {
  return (
    <header className="surface-panel-strong space-y-4 px-6 py-6 md:px-8 md:py-8">
      <p className="meta-kicker">{eyebrow}</p>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl leading-tight font-semibold tracking-tight md:text-4xl">{title}</h1>
        {typeof count === "number" ? (
          <Badge variant="secondary">
            {count} {count === 1 ? "entry" : "entries"}
          </Badge>
        ) : null}
      </div>
      {description ? <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">{description}</p> : null}
    </header>
  );
}

