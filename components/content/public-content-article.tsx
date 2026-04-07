import { format } from "date-fns";
import Image from "next/image";
import { CalendarDaysIcon, FolderKanbanIcon } from "lucide-react";
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
    <article className="mx-auto w-full max-w-5xl space-y-8 py-10 md:space-y-10 md:py-14">
      <header className="space-y-6 px-1">
        <p className="meta-kicker">
          {meta.singular}
        </p>
        <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
          {content.title}
        </h1>

        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted/65 px-3 py-1">
            <CalendarDaysIcon className="size-3.5" />
            {content.publishedAt ? format(content.publishedAt, "MMMM d, yyyy") : "Draft"}
          </span>
          {content.category ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/65 px-3 py-1">
              <FolderKanbanIcon className="size-3.5" />
              {content.category.name}
            </span>
          ) : null}
        </div>

        {content.summary ? (
          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">{content.summary}</p>
        ) : null}

        {content.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {content.tags.map((tag) => (
              <Badge key={tag.tag.slug} variant="secondary">
                {tag.tag.name}
              </Badge>
            ))}
          </div>
        ) : null}
      </header>

      {content.coverImage ? (
        <div className="surface-reading overflow-hidden p-2">
          <Image
            src={content.coverImage.url}
            alt={content.coverImage.altText ?? content.title}
            width={1600}
            height={900}
            unoptimized
            className="h-auto w-full rounded-xl object-cover"
          />
        </div>
      ) : null}

      <section className="surface-reading p-6 md:p-9">
        <RichTextRenderer html={content.bodyHtml} />
      </section>
    </article>
  );
}
