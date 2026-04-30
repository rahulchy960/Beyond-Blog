import { describe, expect, it } from "vitest";
import { QUIZ_STATUS } from "@/lib/content/enums";
import {
  listPublishedQuizzesInputSchema,
  normalizeOptionalText,
  normalizeOptionalUrl,
  optionalUrl,
  quizWriteInputSchema,
  startQuizAttemptInputSchema,
} from "@/lib/quiz/schemas";

describe("quiz schemas", () => {
  it("rejects payloads linked to multiple targets", () => {
    expect(() =>
      quizWriteInputSchema.parse({
        title: "Quiz",
        slug: "quiz",
        description: null,
        status: QUIZ_STATUS.DRAFT,
        isFeatured: false,
        showAnswersAfterSubmit: true,
        allowMultipleAttempts: true,
        timeLimitMinutes: null,
        passingScore: 60,
        coverImageId: null,
        seoTitle: null,
        seoDescription: null,
        contentId: "content_1",
        courseId: "course_1",
        courseLessonId: null,
      }),
    ).toThrow("Link quiz to only one target");
  });

  it("validates guest attempt input", () => {
    const parsed = startQuizAttemptInputSchema.parse({
      quizId: "quiz_1",
      guestName: "Guest",
      guestEmail: "guest@example.com",
    });

    expect(parsed.quizId).toBe("quiz_1");
    expect(parsed.guestEmail).toBe("guest@example.com");
  });

  it("normalizes optional text/url values", () => {
    expect(normalizeOptionalText("  ")).toBeNull();
    expect(normalizeOptionalText("  Value  ")).toBe("Value");
    expect(normalizeOptionalUrl("  https://example.com  ")).toBe("https://example.com");
    expect(optionalUrl().parse("   ")).toBeNull();
  });

  it("applies published list defaults", () => {
    const parsed = listPublishedQuizzesInputSchema.parse({});
    expect(parsed.limit).toBe(24);
    expect(parsed.featuredOnly).toBeUndefined();
  });
});
