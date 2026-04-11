import { ListChecksIcon } from "lucide-react";
import { PublicQuizCard } from "@/components/quiz/public-quiz-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";

type PublicQuizListProps = {
  items: Array<{
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
  }>;
};

export function PublicQuizList({ items }: PublicQuizListProps) {
  return (
    <section className="space-y-7">
      <SectionHeader
        eyebrow="Beyond Blog"
        title="Public Quizzes"
        description="Open assessments for readers and learners. No account required."
      />

      {items.length === 0 ? (
        <EmptyState
          icon={ListChecksIcon}
          title="No published quizzes yet"
          description="Published quizzes will appear here once released from the admin workspace."
        />
      ) : (
        <div className="grid gap-4">
          {items.map((quiz) => (
            <PublicQuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}
    </section>
  );
}
