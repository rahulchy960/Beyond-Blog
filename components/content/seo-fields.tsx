import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SeoFieldsProps = {
  seoTitle: string;
  seoDescription: string;
  onSeoTitleChange: (value: string) => void;
  onSeoDescriptionChange: (value: string) => void;
  titleFallback?: string;
  descriptionFallback?: string | null;
  showHeader?: boolean;
};

export function SeoFields({
  seoTitle,
  seoDescription,
  onSeoTitleChange,
  onSeoDescriptionChange,
  titleFallback = "Untitled",
  descriptionFallback = null,
  showHeader = true,
}: SeoFieldsProps) {
  const effectiveTitle = seoTitle.trim() || titleFallback.trim() || "Untitled";
  const effectiveDescription =
    seoDescription.trim() ||
    descriptionFallback?.trim() ||
    "Default site SEO description will be used.";

  return (
    <section className="space-y-4">
      {showHeader ? (
        <div>
          <h3 className="font-heading text-lg font-semibold">SEO</h3>
          <p className="text-sm leading-7 text-muted-foreground">
            Optional metadata used for search snippets and social previews.
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="seoTitle">SEO title</Label>
        <Input
          id="seoTitle"
          value={seoTitle}
          maxLength={120}
          onChange={(event) => onSeoTitleChange(event.target.value)}
          placeholder="Override page title for search and sharing"
        />
        <p className="text-xs text-muted-foreground">
          Leave empty to use the content title.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="seoDescription">SEO description</Label>
        <Textarea
          id="seoDescription"
          value={seoDescription}
          maxLength={300}
          onChange={(event) => onSeoDescriptionChange(event.target.value)}
          placeholder="Concise summary shown in previews"
          rows={4}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Fallback: content summary, then site defaults.</span>
          <span>{seoDescription.length}/300</span>
        </div>
      </div>

      <div className="rounded-lg border border-border/70 bg-background/60 p-3">
        <p className="truncate text-sm font-semibold">{effectiveTitle}</p>
        <p className="mt-1 line-clamp-3 text-xs leading-6 text-muted-foreground">
          {effectiveDescription}
        </p>
      </div>
    </section>
  );
}
