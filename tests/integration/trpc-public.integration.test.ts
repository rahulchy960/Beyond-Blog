import { beforeEach, describe, expect, it, vi } from "vitest";
import { CONTENT_TYPE, INTERACTION_TARGET_TYPE, QUIZ_STATUS } from "@/lib/content/enums";
import type { createTRPCContext } from "@/server/api/trpc";
import { createPrismaMock } from "@/tests/mocks/prisma";

const mocked = vi.hoisted(() => {
  return {
    getVisitorTokenHash: vi.fn(async () => "visitor_hash"),
    createAuditLog: vi.fn(async () => undefined),
    revalidateContentPaths: vi.fn(),
    revalidateCoursePaths: vi.fn(),
    revalidateQuizPaths: vi.fn(),
    revalidatePublicIndexes: vi.fn(),
  };
});

vi.mock("@/lib/interaction/visitor", () => ({
  getVisitorTokenHash: mocked.getVisitorTokenHash,
}));

vi.mock("@/server/audit/log", () => ({
  createAuditLog: mocked.createAuditLog,
}));

vi.mock("@/lib/cache/revalidate", () => ({
  revalidateContentPaths: mocked.revalidateContentPaths,
  revalidateCoursePaths: mocked.revalidateCoursePaths,
  revalidateQuizPaths: mocked.revalidateQuizPaths,
  revalidatePublicIndexes: mocked.revalidatePublicIndexes,
}));

import { contentRouter } from "@/server/api/routers/content";
import { courseRouter } from "@/server/api/routers/course";
import { interactionRouter } from "@/server/api/routers/interaction";
import { quizRouter } from "@/server/api/routers/quiz";

const toDb = (db: ReturnType<typeof createPrismaMock>) =>
  db as unknown as Awaited<ReturnType<typeof createTRPCContext>>["db"];

describe("tRPC public integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches published content only", async () => {
    const db = createPrismaMock();
    db.content.findMany.mockResolvedValue([
      {
        id: "content_1",
        title: "Published",
        slug: "published",
        publishStatus: "PUBLISHED",
      },
    ]);

    const caller = contentRouter.createCaller({
      db: toDb(db),
      userId: null,
      sessionId: null,
      isAuthenticated: false,
    });

    const result = await caller.listPublished({
      type: CONTENT_TYPE.ARTICLE,
      limit: 10,
    });

    expect(db.content.findMany).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
  });

  it("returns cover image data for public content detail", async () => {
    const db = createPrismaMock();
    db.content.findFirst.mockResolvedValue({
      id: "content_1",
      title: "Published",
      slug: "published",
      summary: null,
      bodyJson: { type: "doc", content: [] },
      coverImage: {
        url: "https://example.ufs.sh/f/cover",
        altText: "Cover image",
      },
      category: null,
      tags: [],
    });

    const caller = contentRouter.createCaller({
      db: toDb(db),
      userId: null,
      sessionId: null,
      isAuthenticated: false,
    });

    const result = await caller.getPublishedBySlug({
      type: CONTENT_TYPE.ARTICLE,
      slug: "published",
    });

    expect(result.coverImage?.url).toBe("https://example.ufs.sh/f/cover");
    expect(db.content.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          coverImage: expect.objectContaining({
            select: expect.objectContaining({
              url: true,
              altText: true,
            }),
          }),
        }),
      }),
    );
  });

  it("fetches published course structure", async () => {
    const db = createPrismaMock();
    db.course.findFirst.mockResolvedValue({
      id: "course_1",
      slug: "course-one",
      status: "PUBLISHED",
      title: "Course One",
      summary: null,
      descriptionJson: { type: "doc", content: [] },
      coverImage: null,
      sections: [
        {
          id: "section_1",
          title: "Intro",
          lessons: [
            {
              id: "lesson_1",
              title: "Lesson 1",
              bodyJson: { type: "doc", content: [] },
              mediaAsset: null,
            },
          ],
        },
      ],
      lessons: [],
    });

    const caller = courseRouter.createCaller({
      db: toDb(db),
      userId: null,
      sessionId: null,
      isAuthenticated: false,
    });

    const result = await caller.getPublishedBySlug({ slug: "course-one" });
    expect(result.slug).toBe("course-one");
    expect(result.sections).toHaveLength(1);
  });

  it("fetches a published quiz", async () => {
    const db = createPrismaMock();
    const requiredColumns = [
      "id",
      "title",
      "slug",
      "description",
      "status",
      "isFeatured",
      "showAnswersAfterSubmit",
      "allowMultipleAttempts",
      "timeLimitMinutes",
      "passingScore",
      "contentId",
      "courseId",
      "courseLessonId",
      "coverImageId",
      "seoTitle",
      "seoDescription",
      "createdByAdminId",
      "publishedAt",
      "createdAt",
      "updatedAt",
    ];
    db.$queryRaw.mockResolvedValue(requiredColumns.map((columnName) => ({ columnName })));
    db.quiz.findFirst.mockResolvedValue({
      id: "quiz_1",
      slug: "quiz-one",
      title: "Quiz One",
      status: QUIZ_STATUS.PUBLISHED,
      coverImage: null,
      questions: [],
      _count: { questions: 0, attempts: 0 },
    });

    const caller = quizRouter.createCaller({
      db: toDb(db),
      userId: null,
      sessionId: null,
      isAuthenticated: false,
    });

    const result = await caller.getPublishedBySlug({ slug: "quiz-one" });
    expect(result.canAttempt).toBe(true);
  });

  it("submits comments for published targets", async () => {
    const db = createPrismaMock();
    db.content.findFirst.mockResolvedValue({ id: "content_1" });
    db.comment.findFirst.mockResolvedValue(null);
    db.siteSetting.findUnique.mockResolvedValue({ commentModerationEnabled: true });
    db.$queryRaw.mockResolvedValue([{ exists: true }]);
    db.comment.create.mockResolvedValue({ id: "comment_1", status: "PENDING" });

    const caller = interactionRouter.createCaller({
      db: toDb(db),
      userId: null,
      sessionId: null,
      isAuthenticated: false,
    });

    const result = await caller.createComment({
      targetType: INTERACTION_TARGET_TYPE.CONTENT,
      targetId: "content_1",
      guestName: "Reader",
      guestEmail: "reader@example.com",
      guestWebsite: "",
      body: "Great post with practical tips.",
      honeypot: "",
    });

    expect(result.accepted).toBe(true);
    expect(db.comment.create).toHaveBeenCalledTimes(1);
  });

  it("toggles likes and returns updated counters", async () => {
    const db = createPrismaMock();
    db.content.findFirst.mockResolvedValue({ id: "content_1" });
    db.contentLike.findFirst.mockResolvedValue(null);
    db.contentLike.create.mockResolvedValue({ id: "like_1" });
    db.contentLike.count.mockResolvedValue(4);

    const caller = interactionRouter.createCaller({
      db: toDb(db),
      userId: null,
      sessionId: null,
      isAuthenticated: false,
    });

    const result = await caller.toggleLike({
      targetType: INTERACTION_TARGET_TYPE.CONTENT,
      targetId: "content_1",
    });

    expect(result).toEqual({ liked: true, likesCount: 4 });
  });

  it("submits quiz attempts and computes score", async () => {
    const db = createPrismaMock();
    db.quizAttempt.findUnique.mockResolvedValue({
      id: "attempt_1",
      visitorTokenHash: "visitor_hash",
      startedAt: new Date("2026-01-01T00:00:00.000Z"),
      submittedAt: null,
      quiz: {
        id: "quiz_1",
        status: QUIZ_STATUS.PUBLISHED,
        showAnswersAfterSubmit: true,
        passingScore: 50,
        timeLimitMinutes: null,
        questions: [
          {
            id: "q1",
            questionText: "Q1",
            points: 2,
            explanation: null,
            options: [
              { id: "o1", optionText: "A", isCorrect: true },
              { id: "o2", optionText: "B", isCorrect: false },
            ],
          },
        ],
      },
    });
    db.quizAnswer.createMany.mockResolvedValue({ count: 1 });
    db.quizAttempt.update.mockResolvedValue({
      id: "attempt_1",
      score: 2,
      totalPoints: 2,
      passed: true,
      submittedAt: new Date("2026-01-01T00:01:00.000Z"),
    });

    const caller = quizRouter.createCaller({
      db: toDb(db),
      userId: null,
      sessionId: null,
      isAuthenticated: false,
    });

    const result = await caller.submitAttempt({
      attemptId: "attempt_1",
      answers: [{ questionId: "q1", optionIds: ["o1"] }],
    });

    expect(result.score).toBe(2);
    expect(result.percentage).toBe(100);
    expect(db.quizAnswer.createMany).toHaveBeenCalledTimes(1);
  });
});
