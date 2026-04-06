import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SeoFieldsProps = {
  seoTitle: string;
  seoDescription: string;
  onSeoTitleChange: (value: string) => void;
  onSeoDescriptionChange: (value: string) => void;
  showHeader?: boolean;
};

export function SeoFields({
  seoTitle,
  seoDescription,
  onSeoTitleChange,
  onSeoDescriptionChange,
  showHeader = true,
}: SeoFieldsProps) {
  return (
    <section className="space-y-4">
      {showHeader ? (
        <div>
        <h3 className="font-heading text-lg font-semibold">SEO</h3>
        <p className="text-sm text-muted-foreground">
          Optional metadata used for previews and search indexing.
        </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="seoTitle">SEO Title</Label>
        <Input
          id="seoTitle"
          value={seoTitle}
          maxLength={120}
          onChange={(event) => onSeoTitleChange(event.target.value)}
          placeholder="Custom SEO title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="seoDescription">SEO Description</Label>
        <Textarea
          id="seoDescription"
          value={seoDescription}
          maxLength={300}
          onChange={(event) => onSeoDescriptionChange(event.target.value)}
          placeholder="Short SEO description"
          rows={4}
        />
      </div>
    </section>
  );
}
