import { format } from "date-fns";
import Image from "next/image";
import { type ContentType } from "@/lib/content/enums";
import { contentTypeMeta } from "@/lib/content/constants";
import { Badge } from "@/components/ui/badge";
import { RichTextRenderer } from "@/components/content/rich-text-renderer";

type PublicContentArticleProps = {
  type: ContentType;
  content: {
    title: string;
    summary: string | null;
    bodyHtml: string;
    publishedAt: Date | null;
    category: { name: string; slug: string } | null;
    tags: Array<{ tag: { name: string; slug: string } }>;
    coverImage: { url: string; altText: string | null } | null;
  };
};

export function PublicContentArticle({ type, content }: PublicContentArticleProps) {
  const meta = contentTypeMeta[type];

  return (
    <article className="mx-auto w-full max-w-3xl space-y-8 py-10 md:py-14">
      <header className="space-y-4">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          {meta.singular}
        </p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight md:text-5xl">
          {content.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {content.publishedAt ? format(content.publishedAt, "MMMM d, yyyy") : "Draft"}
          {content.category ? ` • ${content.category.name}` : ""}
        </p>
        {content.summary ? <p className="text-lg text-muted-foreground">{content.summary}</p> : null}
        <div className="flex flex-wrap gap-2">
          {content.tags.map((tag) => (
            <Badge key={tag.tag.slug} variant="secondary">
              {tag.tag.name}
            </Badge>
          ))}
        </div>
      </header>

      {content.coverImage ? (
        <Image
          src={content.coverImage.url}
          alt={content.coverImage.altText ?? content.title}
          width={1400}
          height={800}
          unoptimized
          className="h-auto w-full rounded-xl border border-border/70 bg-card object-cover"
        />
      ) : null}

      <RichTextRenderer html={content.bodyHtml} />
    </article>
  );
}
