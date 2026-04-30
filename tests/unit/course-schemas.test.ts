import { describe, expect, it } from "vitest";
import {
  COURSE_LESSON_ITEM_TYPE,
  COURSE_STATUS,
} from "@/lib/content/enums";
import {
  courseWriteInputSchema,
  lessonWriteSchema,
} from "@/lib/course/schemas";

describe("course schemas", () => {
  it("validates a full course payload", () => {
    const parsed = courseWriteInputSchema.parse({
      title: "Advanced TypeScript",
      slug: "advanced-typescript",
      summary: "Summary",
      descriptionJson: { type: "doc", content: [] },
      coverImageId: null,
      difficultyLevel: "ADVANCED",
      estimatedDurationMinutes: 180,
      isFeatured: true,
      seoTitle: "Course SEO",
      seoDescription: "Course SEO Description",
      status: COURSE_STATUS.DRAFT,
    });

    expect(parsed.slug).toBe("advanced-typescript");
    expect(parsed.estimatedDurationMinutes).toBe(180);
  });

  it("rejects too-short lesson titles", () => {
    expect(() =>
      lessonWriteSchema.parse({
        courseId: "course_1",
        title: "A",
        slug: null,
        summary: null,
        itemType: COURSE_LESSON_ITEM_TYPE.RICH_TEXT,
        bodyJson: { type: "doc", content: [] },
        mediaAssetId: null,
        externalUrl: null,
        durationMinutes: null,
        isPreview: false,
        isPublished: false,
      }),
    ).toThrow();
  });
});
