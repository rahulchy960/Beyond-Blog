import { z } from "zod";
import { QUIZ_QUESTION_TYPES, QUIZ_STATUSES } from "@/lib/content/enums";
import { slugSchema } from "@/lib/content/schemas";

const optionalTrimmedText = (max: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    },
    z.string().trim().max(max).nullable().optional(),
  );

const optionalUrl = () =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    },
    z.string().trim().url().max(2048).nullable().optional(),
  );

export const quizWriteInputSchema = z
  .object({
    title: z.string().trim().min(3).max(220),
    slug: slugSchema,
    description: optionalTrimmedText(4000),
    status: z.enum(QUIZ_STATUSES),
    isFeatured: z.boolean().default(false),
    showAnswersAfterSubmit: z.boolean().default(true),
    allowMultipleAttempts: z.boolean().default(true),
    timeLimitMinutes: z.number().int().min(1).max(600).optional().nullable(),
    passingScore: z.number().int().min(0).max(100).optional().nullable(),
    coverImageId: z.string().trim().min(1).optional().nullable(),
    seoTitle: optionalTrimmedText(120),
    seoDescription: optionalTrimmedText(320),
    contentId: z.string().trim().min(1).optional().nullable(),
    courseId: z.string().trim().min(1).optional().nullable(),
    courseLessonId: z.string().trim().min(1).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    const linkedCount = [value.contentId, value.courseId, value.courseLessonId].filter(
      (entry) => Boolean(entry && entry.trim().length > 0),
    ).length;

    if (linkedCount > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Link quiz to only one target (content, course, or lesson).",
        path: ["contentId"],
      });
    }
  });

export const createQuizInputSchema = quizWriteInputSchema;

export const updateQuizInputSchema = quizWriteInputSchema.extend({
  id: z.string().trim().min(1),
});

export const deleteQuizInputSchema = z.object({
  id: z.string().trim().min(1),
});

export const listAdminQuizzesInputSchema = z.object({
  query: z.string().trim().max(160).optional(),
  status: z.enum(QUIZ_STATUSES).optional(),
  sort: z.enum(["updated", "newest"]).default("updated"),
  page: z.number().int().min(1).max(500).default(1),
  pageSize: z.number().int().min(6).max(60).default(20),
});

export const listPublishedQuizzesInputSchema = z.object({
  query: z.string().trim().max(160).optional(),
  featuredOnly: z.boolean().optional(),
  limit: z.number().int().min(1).max(60).default(24),
});

export const quizByIdInputSchema = z.object({
  id: z.string().trim().min(1),
});

export const quizBySlugInputSchema = z.object({
  slug: slugSchema,
});

export const updateQuizStatusInputSchema = z.object({
  id: z.string().trim().min(1),
});

export const toggleQuizFeaturedInputSchema = z.object({
  id: z.string().trim().min(1),
  value: z.boolean().optional(),
});

export const createQuizQuestionInputSchema = z.object({
  quizId: z.string().trim().min(1),
  questionText: z.string().trim().min(3).max(5000),
  questionType: z.enum(QUIZ_QUESTION_TYPES).default("SINGLE_CHOICE"),
  explanation: optionalTrimmedText(4000),
  points: z.number().int().min(1).max(100).default(1),
});

export const updateQuizQuestionInputSchema = createQuizQuestionInputSchema.extend({
  id: z.string().trim().min(1),
});

export const deleteQuizQuestionInputSchema = z.object({
  id: z.string().trim().min(1),
});

export const reorderQuizQuestionsInputSchema = z.object({
  quizId: z.string().trim().min(1),
  questionIds: z.array(z.string().trim().min(1)).min(1),
});

export const createQuizOptionInputSchema = z.object({
  questionId: z.string().trim().min(1),
  optionText: z.string().trim().min(1).max(1000),
  isCorrect: z.boolean().default(false),
});

export const updateQuizOptionInputSchema = createQuizOptionInputSchema.extend({
  id: z.string().trim().min(1),
});

export const deleteQuizOptionInputSchema = z.object({
  id: z.string().trim().min(1),
});

export const reorderQuizOptionsInputSchema = z.object({
  questionId: z.string().trim().min(1),
  optionIds: z.array(z.string().trim().min(1)).min(1),
});

export const startQuizAttemptInputSchema = z.object({
  quizId: z.string().trim().min(1),
  guestName: optionalTrimmedText(80),
  guestEmail: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    },
    z.string().trim().email().max(254).nullable().optional(),
  ),
});

export const submitQuizAttemptInputSchema = z.object({
  attemptId: z.string().trim().min(1),
  answers: z.array(
    z.object({
      questionId: z.string().trim().min(1),
      optionIds: z.array(z.string().trim().min(1)).min(1).max(16),
    }),
  ),
});

export const listQuizAttemptsInputSchema = z.object({
  quizId: z.string().trim().min(1).optional(),
  limit: z.number().int().min(1).max(150).default(80),
});

export const quizAnalyticsInputSchema = z.object({
  quizId: z.string().trim().min(1),
});

export function normalizeOptionalText(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeOptionalUrl(value?: string | null) {
  const normalized = normalizeOptionalText(value);
  return normalized;
}

export { optionalUrl };
