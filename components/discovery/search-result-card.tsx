import type { ComponentType } from "react";
import { format } from "date-fns";
import { BookOpenTextIcon, FileQuestionIcon, FileTextIcon, FolderKanbanIcon, GraduationCapIcon, SparklesIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { discoveryTypeMeta } from "@/lib/discovery/constants";
import { cn } from "@/lib/utils";
import { type DiscoveryResultItem, type DiscoveryResultType } from "@/types/discovery";

const typeIconMap: Record<DiscoveryResultType, ComponentType<{ className?: string }>> = {
  JOURNAL: BookOpenTextIcon,
  ARTICLE: FileTextIcon,
  PROJECT: FolderKanbanIcon,
  COURSE: GraduationCapIcon,
  QUIZ: FileQuestionIcon,
};

function compactDate(dateValue: Date | string | null) {
  if (!dateValue) return null;
  const value = new Date(dateValue);
  if (Number.isNaN(value.getTime())) return null;
  return format(value, "MMM d, yyyy");
}

export function SearchResultCard({ item, className }: { item: DiscoveryResultItem; className?: string }) {
  const imageUrl = item.coverImage?.thumbnailUrl ?? item.coverImage?.url ?? null;
  const TypeIcon = typeIconMap[item.type];
  const typeMeta = discoveryTypeMeta[item.type];
  const publishedAt = compactDate(item.publishedAt);

  return (
    <article className={cn("surface-panel overflow-hidden p-2.5 md:p-3", className)}>
      <div className="grid gap-3 md:grid-cols-[11rem_1fr]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border/70 bg-muted/45">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={item.coverImage?.altText ?? item.title}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <TypeIcon className="size-6" />
            </div>
          )}
        </div>

        <div className="space-y-2 px-1 py-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <TypeIcon className="size-3" />
              {typeMeta.label}
            </Badge>
            {item.isFeatured ? (
              <Badge variant="secondary" className="gap-1">
                <SparklesIcon className="size-3" />
                Featured
              </Badge>
            ) : null}
            {publishedAt ? <Badge variant="secondary">{publishedAt}</Badge> : null}
            {item.category ? (
              <Link href={`/categories/${item.category.slug}`}>
                <Badge variant="secondary">{item.category.name}</Badge>
              </Link>
            ) : null}
          </div>

          <h3 className="text-xl leading-tight font-semibold tracking-tight">
            <Link href={item.href} className="hover:text-primary">
              {item.title}
            </Link>
          </h3>
          {item.summary ? <p className="line-clamp-3 text-sm leading-7 text-muted-foreground">{item.summary}</p> : null}

          <div className="flex flex-wrap items-center gap-2">
            {item.meta.difficulty ? <Badge variant="outline">{item.meta.difficulty.toLowerCase()}</Badge> : null}
            {typeof item.meta.lessonCount === "number" ? (
              <Badge variant="outline">{item.meta.lessonCount} lessons</Badge>
            ) : null}
            {typeof item.meta.questionCount === "number" ? (
              <Badge variant="outline">{item.meta.questionCount} questions</Badge>
            ) : null}
            {item.tags.slice(0, 3).map((tag) => (
              <Link key={tag.slug} href={`/tags/${tag.slug}`}>
                <Badge variant="secondary">{tag.name}</Badge>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
