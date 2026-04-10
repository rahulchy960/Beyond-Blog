import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { Clock3Icon, ExternalLinkIcon, Layers3Icon, SparklesIcon } from "lucide-react";
import { courseDifficultyLabels, courseLessonTypeLabels } from "@/lib/course/constants";
import { Badge } from "@/components/ui/badge";
import { RichTextRenderer } from "@/components/content/rich-text-renderer";

type PublicCourseDetailProps = {
  course: {
    title: string;
    summary: string | null;
    descriptionHtml: string | null;
    publishedAt: Date | null;
    difficultyLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null;
    estimatedDurationMinutes: number | null;
    isFeatured: boolean;
    coverImage: {
      id: string;
      url: string;
      thumbnailUrl: string | null;
      altText: string | null;
    } | null;
    sections: Array<{
      id: string;
      title: string;
      description: string | null;
      lessons: Array<{
        id: string;
        title: string;
        summary: string | null;
        itemType: "RICH_TEXT" | "VIDEO" | "IMAGE" | "RESOURCE";
        bodyHtml: string | null;
        mediaAsset: {
          id: string;
          type: "IMAGE" | "VIDEO" | "FILE";
          url: string;
          thumbnailUrl: string | null;
          altText: string | null;
          title: string | null;
          originalFilename: string | null;
          playbackUrl: string | null;
          externalUrl: string | null;
        } | null;
        externalUrl: string | null;
        durationMinutes: number | null;
        isPreview: boolean;
      }>;
    }>;
    lessons: Array<{
      id: string;
      title: string;
      summary: string | null;
      itemType: "RICH_TEXT" | "VIDEO" | "IMAGE" | "RESOURCE";
      bodyHtml: string | null;
      mediaAsset: {
        id: string;
        type: "IMAGE" | "VIDEO" | "FILE";
        url: string;
        thumbnailUrl: string | null;
        altText: string | null;
        title: string | null;
        originalFilename: string | null;
        playbackUrl: string | null;
        externalUrl: string | null;
      } | null;
      externalUrl: string | null;
      durationMinutes: number | null;
      isPreview: boolean;
    }>;
  };
};

function CourseLessonBlock({
  lesson,
}: {
  lesson: PublicCourseDetailProps["course"]["sections"][number]["lessons"][number];
}) {
  return (
    <article className="surface-inset space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-lg font-semibold tracking-tight">{lesson.title}</h4>
        <Badge variant="outline">{courseLessonTypeLabels[lesson.itemType]}</Badge>
        {lesson.isPreview ? <Badge variant="secondary">Preview</Badge> : null}
        {lesson.durationMinutes ? <Badge variant="secondary">{lesson.durationMinutes} min</Badge> : null}
      </div>

      {lesson.summary ? <p className="text-sm leading-7 text-muted-foreground">{lesson.summary}</p> : null}

      {lesson.mediaAsset?.type === "IMAGE" ? (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-muted/45">
          <Image
            src={lesson.mediaAsset.thumbnailUrl ?? lesson.mediaAsset.url}
            alt={lesson.mediaAsset.altText ?? lesson.title}
            width={1200}
            height={700}
            unoptimized
            className="h-auto w-full object-cover"
          />
        </div>
      ) : null}

      {lesson.mediaAsset?.type === "VIDEO" ? (
        <Link
          href={lesson.mediaAsset.playbackUrl ?? lesson.mediaAsset.externalUrl ?? lesson.mediaAsset.url}
          target="_blank"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          Watch linked video
          <ExternalLinkIcon className="size-3.5" />
        </Link>
      ) : null}

      {lesson.mediaAsset?.type === "FILE" ? (
        <Link href={lesson.mediaAsset.url} target="_blank" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          Open resource
          <ExternalLinkIcon className="size-3.5" />
        </Link>
      ) : null}

      {lesson.externalUrl ? (
        <Link href={lesson.externalUrl} target="_blank" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          External link
          <ExternalLinkIcon className="size-3.5" />
        </Link>
      ) : null}

      {lesson.bodyHtml ? <RichTextRenderer html={lesson.bodyHtml} /> : null}
    </article>
  );
}

export function PublicCourseDetail({ course }: PublicCourseDetailProps) {
  const coverUrl = course.coverImage?.thumbnailUrl ?? course.coverImage?.url ?? null;

  return (
    <article className="mx-auto w-full max-w-5xl space-y-8 py-10 md:space-y-10 md:py-14">
      <header className="space-y-5 px-1">
        <p className="meta-kicker">Course</p>
        <h1 className="max-w-4xl text-4xl leading-tight font-semibold tracking-tight md:text-6xl">{course.title}</h1>

        <div className="flex flex-wrap items-center gap-2">
          {course.difficultyLevel ? <Badge variant="outline">{courseDifficultyLabels[course.difficultyLevel]}</Badge> : null}
          {course.estimatedDurationMinutes ? <Badge variant="secondary" className="gap-1"><Clock3Icon className="size-3" />{course.estimatedDurationMinutes} min</Badge> : null}
          <Badge variant="secondary" className="gap-1"><Layers3Icon className="size-3" />Structured modules</Badge>
          {course.isFeatured ? <Badge className="gap-1"><SparklesIcon className="size-3" />Featured</Badge> : null}
          {course.publishedAt ? <Badge variant="secondary">{format(new Date(course.publishedAt), "MMM d, yyyy")}</Badge> : null}
        </div>

        {course.summary ? <p className="max-w-3xl text-lg leading-8 text-muted-foreground">{course.summary}</p> : null}
      </header>

      {coverUrl ? (
        <div className="surface-reading overflow-hidden p-2">
          <Image src={coverUrl} alt={course.coverImage?.altText ?? course.title} width={1600} height={900} unoptimized className="h-auto w-full rounded-xl object-cover" />
        </div>
      ) : null}

      {course.descriptionHtml ? (
        <section className="surface-reading p-6 md:p-9">
          <RichTextRenderer html={course.descriptionHtml} />
        </section>
      ) : null}

      <section className="space-y-4">
        {course.sections.map((section) => (
          <div key={section.id} className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">{section.title}</h2>
              {section.description ? <p className="text-sm leading-7 text-muted-foreground">{section.description}</p> : null}
            </div>
            <div className="space-y-3">{section.lessons.map((lesson) => <CourseLessonBlock key={lesson.id} lesson={lesson} />)}</div>
          </div>
        ))}

        {course.lessons.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight">Additional Lessons</h2>
            <div className="space-y-3">{course.lessons.map((lesson) => <CourseLessonBlock key={lesson.id} lesson={lesson} />)}</div>
          </div>
        ) : null}
      </section>
    </article>
  );
}

