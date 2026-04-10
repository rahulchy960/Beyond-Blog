import Image from "next/image";
import Link from "next/link";
import { Clock3Icon, GraduationCapIcon, Layers3Icon, SparklesIcon } from "lucide-react";
import { courseDifficultyLabels } from "@/lib/course/constants";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/lib/ui/button-variants";
import { cn } from "@/lib/utils";

type PublicCourseCardProps = {
  course: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    difficultyLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null;
    estimatedDurationMinutes: number | null;
    isFeatured: boolean;
    coverImage: {
      id: string;
      url: string;
      thumbnailUrl: string | null;
      altText: string | null;
    } | null;
    _count: {
      lessons: number;
      sections: number;
    };
  };
};

export function PublicCourseCard({ course }: PublicCourseCardProps) {
  const imageUrl = course.coverImage?.thumbnailUrl ?? course.coverImage?.url ?? null;

  return (
    <article className="surface-panel-strong overflow-hidden p-2">
      <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
        <div className="relative aspect-[16/11] overflow-hidden rounded-xl border border-border/70 bg-muted/45">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={course.coverImage?.altText ?? course.title}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <GraduationCapIcon className="size-7" />
            </div>
          )}
        </div>

        <div className="space-y-3 px-1 py-1">
          <div className="flex flex-wrap items-center gap-2">
            {course.difficultyLevel ? (
              <Badge variant="outline">{courseDifficultyLabels[course.difficultyLevel]}</Badge>
            ) : null}
            {course.isFeatured ? (
              <Badge className="gap-1"><SparklesIcon className="size-3" />Featured</Badge>
            ) : null}
            <Badge variant="secondary" className="gap-1">
              <Layers3Icon className="size-3" />
              {course._count.lessons} lessons
            </Badge>
            {course.estimatedDurationMinutes ? (
              <Badge variant="secondary" className="gap-1">
                <Clock3Icon className="size-3" />
                {course.estimatedDurationMinutes} min
              </Badge>
            ) : null}
          </div>

          <h3 className="text-2xl leading-tight font-semibold tracking-tight">{course.title}</h3>
          {course.summary ? <p className="text-sm leading-7 text-muted-foreground">{course.summary}</p> : null}

          <Link href={`/courses/${course.slug}`} className={cn(buttonVariants({ size: "sm" }), "mt-1")}>Explore course</Link>
        </div>
      </div>
    </article>
  );
}

