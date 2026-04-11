import { QUIZ_QUESTION_TYPE, QUIZ_STATUS, type QuizQuestionType, type QuizStatus } from "@/lib/content/enums";

export const quizStatusLabels: Record<QuizStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  CLOSED: "Closed",
};

export const quizStatusOptions = [
  { label: "Draft", value: QUIZ_STATUS.DRAFT },
  { label: "Published", value: QUIZ_STATUS.PUBLISHED },
  { label: "Closed", value: QUIZ_STATUS.CLOSED },
] as const;

export const quizQuestionTypeLabels: Record<QuizQuestionType, string> = {
  SINGLE_CHOICE: "Single choice",
  MULTIPLE_CHOICE: "Multiple choice",
};

export const quizQuestionTypeOptions = [
  { label: "Single choice", value: QUIZ_QUESTION_TYPE.SINGLE_CHOICE },
  { label: "Multiple choice", value: QUIZ_QUESTION_TYPE.MULTIPLE_CHOICE },
] as const;

export const quizAdminBasePath = "/admin/quizzes";
export const quizPublicBasePath = "/quizzes";
