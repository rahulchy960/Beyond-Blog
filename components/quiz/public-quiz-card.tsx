import Link from "next/link";
import { Clock3Icon, ListChecksIcon, SparklesIcon, TimerResetIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GracefulMedia } from "@/components/ui/graceful-media";
import { buttonVariants } from "@/lib/ui/button-variants";
import { cn } from "@/lib/utils";

type PublicQuizCardProps = {
  quiz: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    isFeatured: boolean;
    timeLimitMinutes: number | null;
    passingScore: number | null;
    coverImage: {
      id: string;
      url: string;
      thumbnailUrl: string | null;
      altText: string | null;
    } | null;
    _count: {
      questions: number;
      attempts: number;
    };
  };
};

export function PublicQuizCard({ quiz }: PublicQuizCardProps) {
  const imageUrl = quiz.coverImage?.thumbnailUrl ?? quiz.coverImage?.url ?? null;

  return (
    <article className="surface-panel-strong overflow-hidden p-2">
      <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
        <div className="relative aspect-[16/11] overflow-hidden rounded-xl border border-border/70 bg-muted/40">
          <GracefulMedia
            src={imageUrl}
            alt={quiz.coverImage?.altText ?? quiz.title}
            fill
            fallbackLabel="Quiz cover"
            fallbackIcon={ListChecksIcon}
          />
        </div>

        <div className="space-y-3 px-1 py-1">
          <div className="flex flex-wrap items-center gap-2">
            {quiz.isFeatured ? (
              <Badge className="gap-1">
                <SparklesIcon className="size-3" />
                Featured
              </Badge>
            ) : null}
            <Badge variant="outline" className="gap-1">
              <ListChecksIcon className="size-3" />
              {quiz._count.questions} questions
            </Badge>
            {quiz.timeLimitMinutes ? (
              <Badge variant="secondary" className="gap-1">
                <TimerResetIcon className="size-3" />
                {quiz.timeLimitMinutes} min
              </Badge>
            ) : null}
            {quiz.passingScore !== null ? (
              <Badge variant="secondary" className="gap-1">
                <Clock3Icon className="size-3" />
                Pass {quiz.passingScore}%
              </Badge>
            ) : null}
          </div>

          <h3 className="text-2xl leading-tight font-semibold tracking-tight">{quiz.title}</h3>
          {quiz.description ? (
            <p className="line-clamp-2 text-sm leading-7 text-muted-foreground">{quiz.description}</p>
          ) : null}

          <Link href={`/quizzes/${quiz.slug}`} className={cn(buttonVariants({ size: "sm" }))}>
            Start quiz
          </Link>
        </div>
      </div>
    </article>
  );
}
