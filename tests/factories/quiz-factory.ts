import { QUIZ_STATUS } from "@/lib/content/enums";

let quizCounter = 1;

export function quizFactory(overrides: Partial<{
  id: string;
  title: string;
  slug: string;
  status: typeof QUIZ_STATUS[keyof typeof QUIZ_STATUS];
}> = {}) {
  const index = quizCounter++;
  return {
    id: overrides.id ?? `quiz_${index}`,
    title: overrides.title ?? `Quiz ${index}`,
    slug: overrides.slug ?? `quiz-${index}`,
    status: overrides.status ?? QUIZ_STATUS.PUBLISHED,
  };
}
