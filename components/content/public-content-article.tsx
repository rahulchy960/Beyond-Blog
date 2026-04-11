import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { CalendarDaysIcon, FolderKanbanIcon } from "lucide-react";
import { INTERACTION_TARGET_TYPE, type ContentType } from "@/lib/content/enums";
import { contentTypeMeta } from "@/lib/content/constants";
import { CommentThread } from "@/components/interaction/comment-thread";
import { RelatedContentSection } from "@/components/discovery/related-content-section";
import { Badge } from "@/components/ui/badge";
import { RichTextRenderer } from "@/components/content/rich-text-renderer";
import { type DiscoveryResultItem } from "@/types/discovery";

type PublicContentArticleProps = {
  type: ContentType;
  content: {
    id: string;
    title: string;
    summary: string | null;
    bodyHtml: string;
    publishedAt: Date | null;
    category: { name: string; slug: string } | null;
    tags: Array<{ tag: { name: string; slug: string } }>;
    coverImage: { url: string; altText: string | null } | null;
  };
  relatedItems?: DiscoveryResultItem[];
};

export function PublicContentArticle({ type, content, relatedItems = [] }: PublicContentArticleProps) {
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
            <Link
              href={`/categories/${content.category.slug}`}
              className="inline-flex items-center gap-1 rounded-full bg-muted/65 px-3 py-1 hover:text-foreground"
            >
              <FolderKanbanIcon className="size-3.5" />
              {content.category.name}
            </Link>
          ) : null}
        </div>

        {content.summary ? (
          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">{content.summary}</p>
        ) : null}

        {content.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {content.tags.map((tag) => (
              <Link key={tag.tag.slug} href={`/tags/${tag.tag.slug}`}>
                <Badge variant="secondary">
                  {tag.tag.name}
                </Badge>
              </Link>
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

      <CommentThread
        targetType={INTERACTION_TARGET_TYPE.CONTENT}
        targetId={content.id}
        title="Reader discussion"
      />

      <RelatedContentSection
        items={relatedItems}
        title="Related Publications"
        description="Publications connected by editorial themes, categories, and shared tags."
      />
    </article>
  );
}
