import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { QuizListTable } from "@/components/quiz/quiz-list-table";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/lib/ui/button-variants";

export function AdminQuizListScreen() {
  return (
    <div className="space-y-7">
      <PageHeader
        title="Quizzes"
        description="Design and publish polished public quizzes with controlled answer keys, timing rules, and attempt analytics."
        actions={
          <Link href="/admin/quizzes/new" className={buttonVariants({ size: "sm" })}>
            <PlusIcon className="size-4" />
            New Quiz
          </Link>
        }
      />

      <AnimatedPageWrapper delay={0.03}>
        <QuizListTable />
      </AnimatedPageWrapper>
    </div>
  );
}
