import type { PrismaClient } from "@prisma/client";
import {
  COMMENT_STATUS,
  CONTENT_TYPE,
  COURSE_STATUS,
  INTERACTION_TARGET_TYPE,
  PUBLISH_STATUS,
  QUIZ_STATUS,
  type InteractionTargetType,
} from "@/lib/content/enums";
import { getContentPublicPath } from "@/lib/interaction/constants";
import { isAnalyticsSchemaError, safeAnalyticsQuery } from "@/server/analytics/errors";

export type AnalyticsTimeRange = "7d" | "30d" | "90d" | "all";

type AuditLogListInput = {
  query?: string;
  action?: string;
  entityType?: string;
  timeRange: AnalyticsTimeRange;
  cursor?: string;
  limit: number;
};

type TopPerformingInput = {
  metric: "LIKES" | "COMMENTS" | "ENGAGEMENT" | "QUIZ_ATTEMPTS";
  timeRange: AnalyticsTimeRange;
  limit: number;
};

function getRangeStart(timeRange: AnalyticsTimeRange): Date | null {
  if (timeRange === "all") {
    return null;
  }

  const now = Date.now();
  const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
  return new Date(now - days * 24 * 60 * 60 * 1000);
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildDayBuckets(timeRange: AnalyticsTimeRange) {
  const start = getRangeStart(timeRange);
  if (!start) {
    return [];
  }

  const buckets: string[] = [];
  const cursor = new Date(start);
  const end = new Date();
  cursor.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    buckets.push(dayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return buckets;
}

async function hasPendingCommentStatus(db: PrismaClient) {
  return safeAnalyticsQuery(async () => {
    const rows = await db.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'CommentStatus'
          AND e.enumlabel = 'PENDING'
      ) AS "exists"
    `;

    return rows[0]?.exists ?? false;
  }, false);
}

let quizAnalyticsSchemaState: "unknown" | "ready" | "missing" = "unknown";
let courseAnalyticsReadSchemaState: "unknown" | "ready" | "missing" = "unknown";
let commentAnalyticsReadSchemaState: "unknown" | "ready" | "missing" = "unknown";
let contentLikeAnalyticsReadSchemaState: "unknown" | "ready" | "missing" = "unknown";

async function hasQuizAnalyticsReadSchema(db: PrismaClient) {
  if (quizAnalyticsSchemaState === "ready") {
    return true;
  }

  if (quizAnalyticsSchemaState === "missing") {
    return false;
  }

  const rows = await safeAnalyticsQuery(
    () =>
      db.$queryRaw<Array<{ columnName: string }>>`
        SELECT CAST("column_name" AS text) AS "columnName"
        FROM "information_schema"."columns"
        WHERE "table_schema" = 'public'
          AND "table_name" = 'Quiz'
          AND "column_name" IN (
            'id',
            'title',
            'slug',
            'description',
            'status',
            'isFeatured',
            'showAnswersAfterSubmit',
            'allowMultipleAttempts',
            'timeLimitMinutes',
            'passingScore',
            'contentId',
            'courseId',
            'courseLessonId',
            'coverImageId',
            'seoTitle',
            'seoDescription',
            'createdByAdminId',
            'publishedAt',
            'createdAt',
            'updatedAt'
          )
      `,
    [] as Array<{ columnName: string }>,
  );

  const found = new Set(rows.map((row) => row.columnName));
  const required = [
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
  const ready = required.every((column) => found.has(column));
  quizAnalyticsSchemaState = ready ? "ready" : "missing";
  return ready;
}

async function hasCourseAnalyticsReadSchema(db: PrismaClient) {
  if (courseAnalyticsReadSchemaState === "ready") {
    return true;
  }

  if (courseAnalyticsReadSchemaState === "missing") {
    return false;
  }

  const rows = await safeAnalyticsQuery(
    () =>
      db.$queryRaw<Array<{ columnName: string }>>`
        SELECT CAST("column_name" AS text) AS "columnName"
        FROM "information_schema"."columns"
        WHERE "table_schema" = 'public'
          AND "table_name" = 'Course'
          AND "column_name" IN (
            'id',
            'title',
            'slug',
            'summary',
            'descriptionHtml',
            'descriptionJson',
            'coverImageId',
            'difficultyLevel',
            'estimatedDurationMinutes',
            'status',
            'isFeatured',
            'seoTitle',
            'seoDescription',
            'publishedAt',
            'createdAt',
            'createdByAdminId',
            'updatedAt'
          )
      `,
    [] as Array<{ columnName: string }>,
  );

  const found = new Set(rows.map((row) => row.columnName));
  const required = [
    "id",
    "title",
    "slug",
    "summary",
    "descriptionHtml",
    "descriptionJson",
    "coverImageId",
    "difficultyLevel",
    "estimatedDurationMinutes",
    "status",
    "isFeatured",
    "seoTitle",
    "seoDescription",
    "publishedAt",
    "createdAt",
    "createdByAdminId",
    "updatedAt",
  ];
  const ready = required.every((column) => found.has(column));
  courseAnalyticsReadSchemaState = ready ? "ready" : "missing";
  return ready;
}

async function hasCommentAnalyticsReadSchema(db: PrismaClient) {
  if (commentAnalyticsReadSchemaState === "ready") {
    return true;
  }
  if (commentAnalyticsReadSchemaState === "missing") {
    return false;
  }

  const rows = await safeAnalyticsQuery(
    () =>
      db.$queryRaw<Array<{ columnName: string }>>`
        SELECT CAST("column_name" AS text) AS "columnName"
        FROM "information_schema"."columns"
        WHERE "table_schema" = 'public'
          AND "table_name" = 'Comment'
          AND "column_name" IN (
            'id',
            'targetType',
            'contentId',
            'courseId',
            'courseLessonId',
            'parentId',
            'guestName',
            'guestEmail',
            'guestWebsite',
            'guestFingerprintHash',
            'body',
            'status',
            'moderationNote',
            'moderatedByAdminId',
            'createdAt',
            'updatedAt'
          )
      `,
    [] as Array<{ columnName: string }>,
  );

  const found = new Set(rows.map((row) => row.columnName));
  const required = [
    "id",
    "targetType",
    "contentId",
    "courseId",
    "courseLessonId",
    "parentId",
    "guestName",
    "guestEmail",
    "guestWebsite",
    "guestFingerprintHash",
    "body",
    "status",
    "moderationNote",
    "moderatedByAdminId",
    "createdAt",
    "updatedAt",
  ];
  const ready = required.every((column) => found.has(column));
  commentAnalyticsReadSchemaState = ready ? "ready" : "missing";
  return ready;
}

async function hasContentLikeAnalyticsReadSchema(db: PrismaClient) {
  if (contentLikeAnalyticsReadSchemaState === "ready") {
    return true;
  }
  if (contentLikeAnalyticsReadSchemaState === "missing") {
    return false;
  }

  const rows = await safeAnalyticsQuery(
    () =>
      db.$queryRaw<Array<{ columnName: string }>>`
        SELECT CAST("column_name" AS text) AS "columnName"
        FROM "information_schema"."columns"
        WHERE "table_schema" = 'public'
          AND "table_name" = 'ContentLike'
          AND "column_name" IN (
            'id',
            'targetType',
            'contentId',
            'courseId',
            'courseLessonId',
            'visitorTokenHash',
            'createdAt'
          )
      `,
    [] as Array<{ columnName: string }>,
  );

  const found = new Set(rows.map((row) => row.columnName));
  const required = [
    "id",
    "targetType",
    "contentId",
    "courseId",
    "courseLessonId",
    "visitorTokenHash",
    "createdAt",
  ];
  const ready = required.every((column) => found.has(column));
  contentLikeAnalyticsReadSchemaState = ready ? "ready" : "missing";
  return ready;
}

function getTargetIdFromRow(row: {
  targetType: InteractionTargetType;
  contentId: string | null;
  courseId: string | null;
  courseLessonId: string | null;
}) {
  if (row.targetType === INTERACTION_TARGET_TYPE.CONTENT) return row.contentId;
  if (row.targetType === INTERACTION_TARGET_TYPE.COURSE) return row.courseId;
  return row.courseLessonId;
}

async function getTopContentByLikes(db: PrismaClient, timeRange: AnalyticsTimeRange, limit: number) {
  if (!(await hasContentLikeAnalyticsReadSchema(db))) {
    return [];
  }

  try {
    const start = getRangeStart(timeRange);
    const grouped = await safeAnalyticsQuery(
      () =>
        db.contentLike.groupBy({
          by: ["contentId"],
          where: {
            targetType: INTERACTION_TARGET_TYPE.CONTENT,
            contentId: {
              not: null,
            },
            ...(start
              ? {
                  createdAt: {
                    gte: start,
                  },
                }
              : {}),
          },
          _count: {
            _all: true,
          },
          orderBy: {
            _count: {
              contentId: "desc",
            },
          },
          take: limit,
        }),
      [] as Array<{ contentId: string | null; _count: { _all: number } }>,
    );

    const ids = grouped
      .map((item) => item.contentId)
      .filter((value): value is string => Boolean(value));
    if (ids.length === 0) {
      return [];
    }

    const contentRows = await safeAnalyticsQuery(
      () =>
        db.content.findMany({
          where: {
            id: {
              in: ids,
            },
          },
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            publishStatus: true,
          },
        }),
      [],
    );

    const contentById = new Map(contentRows.map((item) => [item.id, item]));
    return grouped
      .map((item) => {
        if (!item.contentId) return null;
        const content = contentById.get(item.contentId);
        if (!content) return null;

        return {
          id: content.id,
          title: content.title,
          slug: content.slug,
          type: content.type,
          publishStatus: content.publishStatus,
          href: getContentPublicPath(content.type, content.slug),
          likesCount: item._count._all,
        };
      })
      .filter((item): item is Exclude<typeof item, null> => item !== null);
  } catch (error) {
    if (isAnalyticsSchemaError(error)) {
      return [];
    }

    throw error;
  }
}

async function getTopContentByComments(
  db: PrismaClient,
  timeRange: AnalyticsTimeRange,
  limit: number,
) {
  if (!(await hasCommentAnalyticsReadSchema(db))) {
    return [];
  }

  try {
    const start = getRangeStart(timeRange);
    const grouped = await safeAnalyticsQuery(
      () =>
        db.comment.groupBy({
          by: ["contentId"],
          where: {
            targetType: INTERACTION_TARGET_TYPE.CONTENT,
            status: COMMENT_STATUS.VISIBLE,
            contentId: {
              not: null,
            },
            ...(start
              ? {
                  createdAt: {
                    gte: start,
                  },
                }
              : {}),
          },
          _count: {
            _all: true,
          },
          orderBy: {
            _count: {
              contentId: "desc",
            },
          },
          take: limit,
        }),
      [] as Array<{ contentId: string | null; _count: { _all: number } }>,
    );

    const ids = grouped
      .map((item) => item.contentId)
      .filter((value): value is string => Boolean(value));
    if (ids.length === 0) {
      return [];
    }

    const contentRows = await safeAnalyticsQuery(
      () =>
        db.content.findMany({
          where: {
            id: {
              in: ids,
            },
          },
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            publishStatus: true,
          },
        }),
      [],
    );

    const contentById = new Map(contentRows.map((item) => [item.id, item]));
    return grouped
      .map((item) => {
        if (!item.contentId) return null;
        const content = contentById.get(item.contentId);
        if (!content) return null;

        return {
          id: content.id,
          title: content.title,
          slug: content.slug,
          type: content.type,
          publishStatus: content.publishStatus,
          href: getContentPublicPath(content.type, content.slug),
          commentsCount: item._count._all,
        };
      })
      .filter((item): item is Exclude<typeof item, null> => item !== null);
  } catch (error) {
    if (isAnalyticsSchemaError(error)) {
      return [];
    }

    throw error;
  }
}

async function getTopQuizzesByAttempts(
  db: PrismaClient,
  timeRange: AnalyticsTimeRange,
  limit: number,
) {
  if (!(await hasQuizAnalyticsReadSchema(db))) {
    return [];
  }

  const start = getRangeStart(timeRange);
  const grouped = await safeAnalyticsQuery(
    () =>
      db.quizAttempt.groupBy({
        by: ["quizId"],
        where: {
          submittedAt: {
            not: null,
            ...(start ? { gte: start } : {}),
          },
        },
        _count: {
          _all: true,
        },
        orderBy: {
          _count: {
            quizId: "desc",
          },
        },
        take: limit,
      }),
    [] as Array<{ quizId: string; _count: { _all: number } }>,
  );

  if (grouped.length === 0) {
    return [];
  }

  const quizRows = await safeAnalyticsQuery(
    () =>
      db.quiz.findMany({
        where: {
          id: {
            in: grouped.map((item) => item.quizId),
          },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
        },
      }),
    [],
  );

  const quizById = new Map(quizRows.map((item) => [item.id, item]));
  return grouped
    .map((item) => {
      const quiz = quizById.get(item.quizId);
      if (!quiz) return null;

      return {
        id: quiz.id,
        title: quiz.title,
        slug: quiz.slug,
        status: quiz.status,
        href: `/quizzes/${quiz.slug}`,
        attemptsCount: item._count._all,
      };
    })
    .filter((item): item is Exclude<typeof item, null> => item !== null);
}

async function getTopEngagedTargets(db: PrismaClient, timeRange: AnalyticsTimeRange, limit: number) {
  const [hasCommentSchema, hasLikeSchema] = await Promise.all([
    hasCommentAnalyticsReadSchema(db),
    hasContentLikeAnalyticsReadSchema(db),
  ]);
  if (!hasCommentSchema || !hasLikeSchema) {
    return [];
  }

  try {
    const start = getRangeStart(timeRange);
    const [commentGroups, likeGroups] = await Promise.all([
    safeAnalyticsQuery(
      () =>
        db.comment.groupBy({
          by: ["targetType", "contentId", "courseId", "courseLessonId"],
          where: {
            status: COMMENT_STATUS.VISIBLE,
            ...(start
              ? {
                  createdAt: {
                    gte: start,
                  },
                }
              : {}),
          },
          _count: {
            _all: true,
          },
        }),
      [] as Array<{
        targetType: InteractionTargetType;
        contentId: string | null;
        courseId: string | null;
        courseLessonId: string | null;
        _count: { _all: number };
      }>,
    ),
    safeAnalyticsQuery(
      () =>
        db.contentLike.groupBy({
          by: ["targetType", "contentId", "courseId", "courseLessonId"],
          where: start
            ? {
                createdAt: {
                  gte: start,
                },
              }
            : undefined,
          _count: {
            _all: true,
          },
        }),
      [] as Array<{
        targetType: InteractionTargetType;
        contentId: string | null;
        courseId: string | null;
        courseLessonId: string | null;
        _count: { _all: number };
      }>,
    ),
  ]);

  const aggregates = new Map<
    string,
    {
      targetType: InteractionTargetType;
      targetId: string;
      commentsCount: number;
      likesCount: number;
    }
  >();

  for (const row of commentGroups) {
    const targetId = getTargetIdFromRow(row);
    if (!targetId) continue;
    const key = `${row.targetType}:${targetId}`;
    const current = aggregates.get(key);
    if (current) {
      current.commentsCount += row._count._all;
    } else {
      aggregates.set(key, {
        targetType: row.targetType,
        targetId,
        commentsCount: row._count._all,
        likesCount: 0,
      });
    }
  }

  for (const row of likeGroups) {
    const targetId = getTargetIdFromRow(row);
    if (!targetId) continue;
    const key = `${row.targetType}:${targetId}`;
    const current = aggregates.get(key);
    if (current) {
      current.likesCount += row._count._all;
    } else {
      aggregates.set(key, {
        targetType: row.targetType,
        targetId,
        commentsCount: 0,
        likesCount: row._count._all,
      });
    }
  }

  const ranked = Array.from(aggregates.values())
    .map((item) => ({
      ...item,
      engagementScore: item.commentsCount * 2 + item.likesCount,
    }))
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, limit);

  const contentIds = ranked
    .filter((item) => item.targetType === INTERACTION_TARGET_TYPE.CONTENT)
    .map((item) => item.targetId);
  const courseIds = ranked
    .filter((item) => item.targetType === INTERACTION_TARGET_TYPE.COURSE)
    .map((item) => item.targetId);
  const lessonIds = ranked
    .filter((item) => item.targetType === INTERACTION_TARGET_TYPE.COURSE_LESSON)
    .map((item) => item.targetId);

  const [contents, courses, lessons] = await Promise.all([
    safeAnalyticsQuery(
      () =>
        db.content.findMany({
          where: {
            id: {
              in: contentIds,
            },
          },
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
          },
        }),
      [],
    ),
    safeAnalyticsQuery(
      () =>
        db.course.findMany({
          where: {
            id: {
              in: courseIds,
            },
          },
          select: {
            id: true,
            title: true,
            slug: true,
          },
        }),
      [],
    ),
    safeAnalyticsQuery(
      () =>
        db.courseLesson.findMany({
          where: {
            id: {
              in: lessonIds,
            },
          },
          select: {
            id: true,
            title: true,
            course: {
              select: {
                slug: true,
              },
            },
          },
        }),
      [],
    ),
  ]);

  const contentMap = new Map(contents.map((item) => [item.id, item]));
  const courseMap = new Map(courses.map((item) => [item.id, item]));
  const lessonMap = new Map(lessons.map((item) => [item.id, item]));

    return ranked
      .map((item) => {
        if (item.targetType === INTERACTION_TARGET_TYPE.CONTENT) {
          const content = contentMap.get(item.targetId);
          if (!content) return null;
          return {
            ...item,
            title: content.title,
            href: getContentPublicPath(content.type, content.slug),
          };
        }

        if (item.targetType === INTERACTION_TARGET_TYPE.COURSE) {
          const course = courseMap.get(item.targetId);
          if (!course) return null;
          return {
            ...item,
            title: course.title,
            href: `/courses/${course.slug}`,
          };
        }

        const lesson = lessonMap.get(item.targetId);
        if (!lesson) return null;
        return {
          ...item,
          title: lesson.title,
          href: `/courses/${lesson.course.slug}#lesson-${lesson.id}`,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  } catch (error) {
    if (isAnalyticsSchemaError(error)) {
      return [];
    }

    throw error;
  }
}

async function getRecentPublished(db: PrismaClient, limit: number) {
  const [hasCourseSchema, hasQuizSchema] = await Promise.all([
    hasCourseAnalyticsReadSchema(db),
    hasQuizAnalyticsReadSchema(db),
  ]);
  const [contents, courses, quizzes] = await Promise.all([
    safeAnalyticsQuery(
      () =>
        db.content.findMany({
          where: {
            publishStatus: PUBLISH_STATUS.PUBLISHED,
            publishedAt: {
              not: null,
            },
          },
          orderBy: [{ publishedAt: "desc" }],
          take: limit,
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            publishedAt: true,
          },
        }),
      [],
    ),
    hasCourseSchema
      ? safeAnalyticsQuery(
          () =>
            db.course.findMany({
              where: {
                status: COURSE_STATUS.PUBLISHED,
                publishedAt: {
                  not: null,
                },
              },
              orderBy: [{ publishedAt: "desc" }],
              take: limit,
              select: {
                id: true,
                title: true,
                slug: true,
                publishedAt: true,
              },
            }),
          [],
        )
      : Promise.resolve([]),
    hasQuizSchema
      ? safeAnalyticsQuery(
          () =>
            db.quiz.findMany({
              where: {
                status: QUIZ_STATUS.PUBLISHED,
                publishedAt: {
                  not: null,
                },
              },
              orderBy: [{ publishedAt: "desc" }],
              take: limit,
              select: {
                id: true,
                title: true,
                slug: true,
                publishedAt: true,
              },
            }),
          [],
        )
      : Promise.resolve([]),
  ]);

  return [
    ...contents.map((item) => ({
      id: item.id,
      kind: "CONTENT" as const,
      title: item.title,
      href: getContentPublicPath(item.type, item.slug),
      publishedAt: item.publishedAt as Date,
    })),
    ...courses.map((item) => ({
      id: item.id,
      kind: "COURSE" as const,
      title: item.title,
      href: `/courses/${item.slug}`,
      publishedAt: item.publishedAt as Date,
    })),
    ...quizzes.map((item) => ({
      id: item.id,
      kind: "QUIZ" as const,
      title: item.title,
      href: `/quizzes/${item.slug}`,
      publishedAt: item.publishedAt as Date,
    })),
  ]
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, limit);
}

async function getRecentAdminActions(db: PrismaClient, limit: number) {
  const logs = await safeAnalyticsQuery(
    () =>
      db.auditLog.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: limit,
        include: {
          adminUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
    [],
  );

  return logs.map((item) => ({
    id: item.id,
    action: item.action,
    entityType: item.entityType,
    entityId: item.entityId,
    metadata: item.metadata,
    createdAt: item.createdAt,
    admin: {
      id: item.adminUser.id,
      name:
        `${item.adminUser.firstName ?? ""} ${item.adminUser.lastName ?? ""}`.trim() ||
        item.adminUser.email,
      email: item.adminUser.email,
    },
  }));
}

async function getRecentPublicActivity(db: PrismaClient, limit: number) {
  const [hasCommentSchema, hasQuizSchema] = await Promise.all([
    hasCommentAnalyticsReadSchema(db),
    hasQuizAnalyticsReadSchema(db),
  ]);

  const [comments, attempts] = await Promise.all([
    hasCommentSchema
      ? safeAnalyticsQuery(
          () =>
            db.comment.findMany({
              where: {
                status: {
                  in: [COMMENT_STATUS.VISIBLE, COMMENT_STATUS.PENDING],
                },
              },
              orderBy: [{ createdAt: "desc" }],
              take: limit,
              include: {
                content: {
                  select: {
                    title: true,
                    slug: true,
                    type: true,
                  },
                },
                course: {
                  select: {
                    title: true,
                    slug: true,
                  },
                },
                courseLesson: {
                  select: {
                    id: true,
                    title: true,
                    course: {
                      select: {
                        slug: true,
                      },
                    },
                  },
                },
              },
            }),
          [],
        )
      : Promise.resolve([]),
    hasQuizSchema
      ? safeAnalyticsQuery(
          () =>
            db.quizAttempt.findMany({
              where: {
                submittedAt: {
                  not: null,
                },
              },
              orderBy: [{ submittedAt: "desc" }],
              take: limit,
              include: {
                quiz: {
                  select: {
                    title: true,
                    slug: true,
                  },
                },
              },
            }),
          [],
        )
      : Promise.resolve([]),
  ]);

  const commentItems = comments.map((comment) => {
    const base = {
      id: comment.id,
      type: "COMMENT" as const,
      occurredAt: comment.createdAt,
      actorLabel: comment.guestName,
      summary: comment.body,
      status: comment.status,
      href: "/",
      targetTitle: "Unavailable target",
    };

    if (comment.targetType === INTERACTION_TARGET_TYPE.CONTENT && comment.content) {
      return {
        ...base,
        href: getContentPublicPath(comment.content.type, comment.content.slug),
        targetTitle: comment.content.title,
      };
    }

    if (comment.targetType === INTERACTION_TARGET_TYPE.COURSE && comment.course) {
      return {
        ...base,
        href: `/courses/${comment.course.slug}`,
        targetTitle: comment.course.title,
      };
    }

    if (comment.courseLesson) {
      return {
        ...base,
        href: `/courses/${comment.courseLesson.course.slug}#lesson-${comment.courseLesson.id}`,
        targetTitle: comment.courseLesson.title,
      };
    }

    return base;
  });

  const attemptItems = attempts.map((attempt) => ({
    id: attempt.id,
    type: "QUIZ_ATTEMPT" as const,
    occurredAt: attempt.submittedAt as Date,
    actorLabel: attempt.guestName ?? "Guest",
    summary: `${attempt.score ?? 0}/${attempt.totalPoints ?? 0} points`,
    status: attempt.passed === null ? "NA" : attempt.passed ? "PASSED" : "FAILED",
    href: `/quizzes/${attempt.quiz.slug}`,
    targetTitle: attempt.quiz.title,
  }));

  return [...commentItems, ...attemptItems]
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, limit);
}

async function getCourseSignals(db: PrismaClient, timeRange: AnalyticsTimeRange, limit: number) {
  const [hasCourseSchema, hasCommentSchema, hasLikeSchema] = await Promise.all([
    hasCourseAnalyticsReadSchema(db),
    hasCommentAnalyticsReadSchema(db),
    hasContentLikeAnalyticsReadSchema(db),
  ]);

  if (!hasCourseSchema || !hasCommentSchema || !hasLikeSchema) {
    return [];
  }

  const start = getRangeStart(timeRange);
  const [courses, courseCommentGroups, courseLikeGroups] = await Promise.all([
    safeAnalyticsQuery(
      () =>
        db.course.findMany({
          orderBy: [{ updatedAt: "desc" }],
          take: 120,
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            _count: {
              select: {
                sections: true,
                lessons: true,
              },
            },
          },
        }),
      [],
    ),
    safeAnalyticsQuery(
      () =>
        db.comment.groupBy({
          by: ["courseId"],
          where: {
            targetType: INTERACTION_TARGET_TYPE.COURSE,
            status: COMMENT_STATUS.VISIBLE,
            courseId: {
              not: null,
            },
            ...(start
              ? {
                  createdAt: {
                    gte: start,
                  },
                }
              : {}),
          },
          _count: {
            _all: true,
          },
        }),
      [] as Array<{ courseId: string | null; _count: { _all: number } }>,
    ),
    safeAnalyticsQuery(
      () =>
        db.contentLike.groupBy({
          by: ["courseId"],
          where: {
            targetType: INTERACTION_TARGET_TYPE.COURSE,
            courseId: {
              not: null,
            },
            ...(start
              ? {
                  createdAt: {
                    gte: start,
                  },
                }
              : {}),
          },
          _count: {
            _all: true,
          },
        }),
      [] as Array<{ courseId: string | null; _count: { _all: number } }>,
    ),
  ]);

  const commentsByCourse = new Map(
    courseCommentGroups
      .filter((item): item is { courseId: string; _count: { _all: number } } => Boolean(item.courseId))
      .map((item) => [item.courseId, item._count._all]),
  );
  const likesByCourse = new Map(
    courseLikeGroups
      .filter((item): item is { courseId: string; _count: { _all: number } } => Boolean(item.courseId))
      .map((item) => [item.courseId, item._count._all]),
  );

  return courses
    .map((course) => {
      const commentsCount = commentsByCourse.get(course.id) ?? 0;
      const likesCount = likesByCourse.get(course.id) ?? 0;

      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        status: course.status,
        href: `/courses/${course.slug}`,
        sectionsCount: course._count.sections,
        lessonsCount: course._count.lessons,
        quizzesCount: 0,
        commentsCount,
        likesCount,
        engagementScore: commentsCount * 2 + likesCount,
      };
    })
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, limit);
}

function createEmptyDashboardSummary() {
  const contentByType = [CONTENT_TYPE.JOURNAL, CONTENT_TYPE.ARTICLE, CONTENT_TYPE.PROJECT].map(
    (type) => ({
      type,
      total: 0,
      published: 0,
      draft: 0,
      archived: 0,
    }),
  );

  return {
    metrics: {
      totalContent: 0,
      publishedContent: 0,
      draftContent: 0,
      archivedContent: 0,
      totalComments: 0,
      visibleComments: 0,
      pendingComments: 0,
      hiddenComments: 0,
      deletedComments: 0,
      totalLikes: 0,
      totalQuizzes: 0,
      totalQuizAttempts: 0,
      totalCourses: 0,
      totalAuditLogs: 0,
      totalMediaAssets: 0,
    },
    momentum: {
      comments7d: 0,
      likes7d: 0,
      attempts7d: 0,
      published7d: 0,
      published30d: 0,
    },
    attention: {
      pendingComments: 0,
      staleDraftContent: 0,
      staleDraftCourses: 0,
      hiddenComments: 0,
      draftCourses: 0,
      draftQuizzes: 0,
    },
    contentByType,
    recentPublished: [],
    recentAdminActions: [],
    recentPublicActivity: [],
    topLikedContent: [],
    topCommentedContent: [],
    topQuizzesByAttempts: [],
    topEngagedTargets: [],
    courseSignals: [],
  };
}

export async function getDashboardSummary(db: PrismaClient) {
  try {
    const pendingSupported = await hasPendingCommentStatus(db);
    const start7d = getRangeStart("7d") as Date;
    const start30d = getRangeStart("30d") as Date;

    const [
      totalContent,
      publishedContent,
      draftContent,
      archivedContent,
      totalComments,
      visibleComments,
      hiddenComments,
      deletedComments,
      pendingComments,
      totalLikes,
      totalQuizzes,
      totalQuizAttempts,
      totalCourses,
      totalAuditLogs,
      totalMediaAssets,
      contentTypeGroups,
      contentTypeStatusGroups,
      staleDraftContent,
      staleDraftCourses,
      draftCourses,
      draftQuizzes,
      comments7d,
      likes7d,
      attempts7d,
      published7d,
      published30d,
      recentPublished,
      recentAdminActions,
      recentPublicActivity,
      topLikedContent,
      topCommentedContent,
      topQuizzesByAttempts,
      topEngagedTargets,
      courseSignals,
    ] = await Promise.all([
    safeAnalyticsQuery(() => db.content.count(), 0),
    safeAnalyticsQuery(
      () =>
        db.content.count({
          where: {
            publishStatus: PUBLISH_STATUS.PUBLISHED,
          },
        }),
      0,
    ),
    safeAnalyticsQuery(
      () =>
        db.content.count({
          where: {
            publishStatus: PUBLISH_STATUS.DRAFT,
          },
        }),
      0,
    ),
    safeAnalyticsQuery(
      () =>
        db.content.count({
          where: {
            publishStatus: PUBLISH_STATUS.ARCHIVED,
          },
        }),
      0,
    ),
    safeAnalyticsQuery(() => db.comment.count(), 0),
    safeAnalyticsQuery(
      () =>
        db.comment.count({
          where: {
            status: COMMENT_STATUS.VISIBLE,
          },
        }),
      0,
    ),
    safeAnalyticsQuery(
      () =>
        db.comment.count({
          where: {
            status: COMMENT_STATUS.HIDDEN,
          },
        }),
      0,
    ),
    safeAnalyticsQuery(
      () =>
        db.comment.count({
          where: {
            status: COMMENT_STATUS.DELETED,
          },
        }),
      0,
    ),
    pendingSupported
      ? safeAnalyticsQuery(
          () =>
            db.comment.count({
              where: {
                status: COMMENT_STATUS.PENDING,
              },
            }),
          0,
        )
      : Promise.resolve(0),
    safeAnalyticsQuery(() => db.contentLike.count(), 0),
    safeAnalyticsQuery(() => db.quiz.count(), 0),
    safeAnalyticsQuery(() => db.quizAttempt.count(), 0),
    safeAnalyticsQuery(() => db.course.count(), 0),
    safeAnalyticsQuery(() => db.auditLog.count(), 0),
    safeAnalyticsQuery(() => db.mediaAsset.count(), 0),
    safeAnalyticsQuery(
      () =>
        db.content.groupBy({
          by: ["type"],
          _count: {
            _all: true,
          },
        }),
      [] as Array<{ type: keyof typeof CONTENT_TYPE; _count: { _all: number } }>,
    ),
    safeAnalyticsQuery(
      () =>
        db.content.groupBy({
          by: ["type", "publishStatus"],
          _count: {
            _all: true,
          },
        }),
      [] as Array<{
        type: keyof typeof CONTENT_TYPE;
        publishStatus: keyof typeof PUBLISH_STATUS;
        _count: { _all: number };
      }>,
    ),
    safeAnalyticsQuery(
      () =>
        db.content.count({
          where: {
            publishStatus: PUBLISH_STATUS.DRAFT,
            updatedAt: {
              lt: start30d,
            },
          },
        }),
      0,
    ),
    safeAnalyticsQuery(
      () =>
        db.course.count({
          where: {
            status: COURSE_STATUS.DRAFT,
            updatedAt: {
              lt: start30d,
            },
          },
        }),
      0,
    ),
    safeAnalyticsQuery(
      () =>
        db.course.count({
          where: {
            status: COURSE_STATUS.DRAFT,
          },
        }),
      0,
    ),
    safeAnalyticsQuery(
      () =>
        db.quiz.count({
          where: {
            status: QUIZ_STATUS.DRAFT,
          },
        }),
      0,
    ),
    safeAnalyticsQuery(
      () =>
        db.comment.count({
          where: {
            createdAt: {
              gte: start7d,
            },
            status: {
              in: pendingSupported
                ? [COMMENT_STATUS.VISIBLE, COMMENT_STATUS.PENDING]
                : [COMMENT_STATUS.VISIBLE],
            },
          },
        }),
      0,
    ),
    safeAnalyticsQuery(
      () =>
        db.contentLike.count({
          where: {
            createdAt: {
              gte: start7d,
            },
          },
        }),
      0,
    ),
    safeAnalyticsQuery(
      () =>
        db.quizAttempt.count({
          where: {
            submittedAt: {
              gte: start7d,
            },
          },
        }),
      0,
    ),
    safeAnalyticsQuery(
      () =>
        db.content.count({
          where: {
            publishStatus: PUBLISH_STATUS.PUBLISHED,
            publishedAt: {
              gte: start7d,
            },
          },
        }),
      0,
    ),
    safeAnalyticsQuery(
      () =>
        db.content.count({
          where: {
            publishStatus: PUBLISH_STATUS.PUBLISHED,
            publishedAt: {
              gte: start30d,
            },
          },
        }),
      0,
    ),
      safeAnalyticsQuery(() => getRecentPublished(db, 10), []),
      safeAnalyticsQuery(() => getRecentAdminActions(db, 10), []),
      safeAnalyticsQuery(() => getRecentPublicActivity(db, 10), []),
      safeAnalyticsQuery(() => getTopContentByLikes(db, "30d", 6), []),
      safeAnalyticsQuery(() => getTopContentByComments(db, "30d", 6), []),
      safeAnalyticsQuery(() => getTopQuizzesByAttempts(db, "30d", 6), []),
      safeAnalyticsQuery(() => getTopEngagedTargets(db, "30d", 6), []),
      safeAnalyticsQuery(() => getCourseSignals(db, "30d", 6), []),
    ]);

    const baseTypes = [CONTENT_TYPE.JOURNAL, CONTENT_TYPE.ARTICLE, CONTENT_TYPE.PROJECT];
    const contentByType = baseTypes.map((type) => {
      const total = contentTypeGroups.find((item) => item.type === type)?._count._all ?? 0;

      const published =
        contentTypeStatusGroups.find(
          (item) => item.type === type && item.publishStatus === PUBLISH_STATUS.PUBLISHED,
        )?._count._all ?? 0;
      const draft =
        contentTypeStatusGroups.find(
          (item) => item.type === type && item.publishStatus === PUBLISH_STATUS.DRAFT,
        )?._count._all ?? 0;
      const archived =
        contentTypeStatusGroups.find(
          (item) => item.type === type && item.publishStatus === PUBLISH_STATUS.ARCHIVED,
        )?._count._all ?? 0;

      return {
        type,
        total,
        published,
        draft,
        archived,
      };
    });

    return {
      metrics: {
        totalContent,
        publishedContent,
        draftContent,
        archivedContent,
        totalComments,
        visibleComments,
        pendingComments,
        hiddenComments,
        deletedComments,
        totalLikes,
        totalQuizzes,
        totalQuizAttempts,
        totalCourses,
        totalAuditLogs,
        totalMediaAssets,
      },
      momentum: {
        comments7d,
        likes7d,
        attempts7d,
        published7d,
        published30d,
      },
      attention: {
        pendingComments,
        staleDraftContent,
        staleDraftCourses,
        hiddenComments,
        draftCourses,
        draftQuizzes,
      },
      contentByType,
      recentPublished,
      recentAdminActions,
      recentPublicActivity,
      topLikedContent,
      topCommentedContent,
      topQuizzesByAttempts,
      topEngagedTargets,
      courseSignals,
    };
  } catch (error) {
    if (isAnalyticsSchemaError(error)) {
      return createEmptyDashboardSummary();
    }

    throw error;
  }
}

export async function getAnalyticsDetail(
  db: PrismaClient,
  timeRange: AnalyticsTimeRange,
) {
  const start = getRangeStart(timeRange);
  const dayBuckets = buildDayBuckets(timeRange);

  try {
    const pendingSupported = await hasPendingCommentStatus(db);
    const [hasCourseSchema, hasQuizSchema, hasCommentSchema, hasLikeSchema] = await Promise.all([
      hasCourseAnalyticsReadSchema(db),
      hasQuizAnalyticsReadSchema(db),
      hasCommentAnalyticsReadSchema(db),
      hasContentLikeAnalyticsReadSchema(db),
    ]);

    const [contentPublishes, coursePublishes, quizPublishes, comments, likes, attempts] =
      await Promise.all([
      safeAnalyticsQuery(
        () =>
          db.content.findMany({
            where: {
              publishStatus: PUBLISH_STATUS.PUBLISHED,
              publishedAt: {
                not: null,
                ...(start ? { gte: start } : {}),
              },
            },
            select: {
              publishedAt: true,
            },
          }),
        [],
      ),
      hasCourseSchema
        ? safeAnalyticsQuery(
            () =>
              db.course.findMany({
                where: {
                  status: COURSE_STATUS.PUBLISHED,
                  publishedAt: {
                    not: null,
                    ...(start ? { gte: start } : {}),
                  },
                },
                select: {
                  publishedAt: true,
                },
              }),
            [],
          )
        : Promise.resolve([]),
      hasQuizSchema
        ? safeAnalyticsQuery(
            () =>
              db.quiz.findMany({
                where: {
                  status: QUIZ_STATUS.PUBLISHED,
                  publishedAt: {
                    not: null,
                    ...(start ? { gte: start } : {}),
                  },
                },
                select: {
                  publishedAt: true,
                },
              }),
            [],
          )
        : Promise.resolve([]),
      hasCommentSchema
        ? safeAnalyticsQuery(
            () =>
              db.comment.findMany({
                where: {
                  createdAt: start ? { gte: start } : undefined,
                  status: {
                    in: pendingSupported
                      ? [COMMENT_STATUS.VISIBLE, COMMENT_STATUS.PENDING]
                      : [COMMENT_STATUS.VISIBLE],
                  },
                },
                select: {
                  createdAt: true,
                },
              }),
            [],
          )
        : Promise.resolve([]),
      hasLikeSchema
        ? safeAnalyticsQuery(
            () =>
              db.contentLike.findMany({
                where: {
                  createdAt: start ? { gte: start } : undefined,
                },
                select: {
                  createdAt: true,
                },
              }),
            [],
          )
        : Promise.resolve([]),
      safeAnalyticsQuery(
        () =>
          db.quizAttempt.findMany({
            where: {
              submittedAt: {
                not: null,
                ...(start ? { gte: start } : {}),
              },
            },
            select: {
              submittedAt: true,
            },
          }),
        [],
      ),
      ]);

  const publishMap = new Map<
    string,
    { content: number; courses: number; quizzes: number; total: number }
  >();
  const interactionMap = new Map<
    string,
    { comments: number; likes: number; quizAttempts: number; total: number }
  >();

  for (const bucket of dayBuckets) {
    publishMap.set(bucket, { content: 0, courses: 0, quizzes: 0, total: 0 });
    interactionMap.set(bucket, { comments: 0, likes: 0, quizAttempts: 0, total: 0 });
  }

  for (const row of contentPublishes) {
    if (!row.publishedAt) continue;
    const key = dayKey(row.publishedAt);
    const slot = publishMap.get(key);
    if (!slot) continue;
    slot.content += 1;
    slot.total += 1;
  }

  for (const row of coursePublishes) {
    if (!row.publishedAt) continue;
    const key = dayKey(row.publishedAt);
    const slot = publishMap.get(key);
    if (!slot) continue;
    slot.courses += 1;
    slot.total += 1;
  }

  for (const row of quizPublishes) {
    if (!row.publishedAt) continue;
    const key = dayKey(row.publishedAt);
    const slot = publishMap.get(key);
    if (!slot) continue;
    slot.quizzes += 1;
    slot.total += 1;
  }

  for (const row of comments) {
    const key = dayKey(row.createdAt);
    const slot = interactionMap.get(key);
    if (!slot) continue;
    slot.comments += 1;
    slot.total += 1;
  }

  for (const row of likes) {
    const key = dayKey(row.createdAt);
    const slot = interactionMap.get(key);
    if (!slot) continue;
    slot.likes += 1;
    slot.total += 1;
  }

  for (const row of attempts) {
    if (!row.submittedAt) continue;
    const key = dayKey(row.submittedAt);
    const slot = interactionMap.get(key);
    if (!slot) continue;
    slot.quizAttempts += 1;
    slot.total += 1;
  }

    const [topByLikes, topByComments, topByQuizAttempts, courseSignals, summary] =
      await Promise.all([
        safeAnalyticsQuery(() => getTopContentByLikes(db, timeRange, 8), []),
        safeAnalyticsQuery(() => getTopContentByComments(db, timeRange, 8), []),
        safeAnalyticsQuery(() => getTopQuizzesByAttempts(db, timeRange, 8), []),
        safeAnalyticsQuery(() => getCourseSignals(db, timeRange, 8), []),
        safeAnalyticsQuery(() => getDashboardSummary(db), createEmptyDashboardSummary()),
      ]);

    return {
      timeRange,
      summary,
      publishTrend: Array.from(publishMap.entries()).map(([date, value]) => ({
        date,
        ...value,
      })),
      interactionTrend: Array.from(interactionMap.entries()).map(([date, value]) => ({
        date,
        ...value,
      })),
      topByLikes,
      topByComments,
      topByQuizAttempts,
      courseSignals,
    };
  } catch (error) {
    if (isAnalyticsSchemaError(error)) {
      return {
        timeRange,
        summary: createEmptyDashboardSummary(),
        publishTrend: dayBuckets.map((date) => ({
          date,
          content: 0,
          courses: 0,
          quizzes: 0,
          total: 0,
        })),
        interactionTrend: dayBuckets.map((date) => ({
          date,
          comments: 0,
          likes: 0,
          quizAttempts: 0,
          total: 0,
        })),
        topByLikes: [],
        topByComments: [],
        topByQuizAttempts: [],
        courseSignals: [],
      };
    }

    throw error;
  }
}

export async function getTopPerformingContent(
  db: PrismaClient,
  input: TopPerformingInput,
) {
  if (input.metric === "QUIZ_ATTEMPTS") {
    const topQuizzes = await getTopQuizzesByAttempts(db, input.timeRange, input.limit);
    return {
      metric: input.metric,
      items: topQuizzes.map((item) => ({
        id: item.id,
        title: item.title,
        href: item.href,
        primaryCount: item.attemptsCount,
        secondaryCount: 0,
        kind: "QUIZ",
      })),
    };
  }

  const [topLikes, topComments] = await Promise.all([
    getTopContentByLikes(db, input.timeRange, Math.max(input.limit, 20)),
    getTopContentByComments(db, input.timeRange, Math.max(input.limit, 20)),
  ]);

  const likesMap = new Map(topLikes.map((item) => [item.id, item.likesCount]));
  const commentsMap = new Map(topComments.map((item) => [item.id, item.commentsCount]));
  const contentMap = new Map(
    [...topLikes, ...topComments].map((item) => [
      item.id,
      { title: item.title, href: item.href, kind: item.type },
    ]),
  );

  const allIds = new Set<string>([
    ...topLikes.map((item) => item.id),
    ...topComments.map((item) => item.id),
  ]);

  const ranked = Array.from(allIds)
    .map((id) => {
      const likes = likesMap.get(id) ?? 0;
      const comments = commentsMap.get(id) ?? 0;
      const base = contentMap.get(id);
      if (!base) return null;

      return {
        id,
        title: base.title,
        href: base.href,
        kind: base.kind,
        likes,
        comments,
        engagement: comments * 2 + likes,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const sorted =
    input.metric === "LIKES"
      ? ranked.sort((a, b) => b.likes - a.likes)
      : input.metric === "COMMENTS"
        ? ranked.sort((a, b) => b.comments - a.comments)
        : ranked.sort((a, b) => b.engagement - a.engagement);

  return {
    metric: input.metric,
    items: sorted.slice(0, input.limit).map((item) => ({
      id: item.id,
      title: item.title,
      href: item.href,
      primaryCount:
        input.metric === "LIKES"
          ? item.likes
          : input.metric === "COMMENTS"
            ? item.comments
            : item.engagement,
      secondaryCount: input.metric === "LIKES" ? item.comments : item.likes,
      kind: "CONTENT",
    })),
  };
}

export async function listAuditLogs(db: PrismaClient, input: AuditLogListInput) {
  const start = getRangeStart(input.timeRange);
  const take = input.limit + 1;

  const rows = await safeAnalyticsQuery(
    () =>
      db.auditLog.findMany({
        where: {
          ...(start
            ? {
                createdAt: {
                  gte: start,
                },
              }
            : {}),
          ...(input.action
            ? {
                action: {
                  contains: input.action,
                  mode: "insensitive",
                },
              }
            : {}),
          ...(input.entityType
            ? {
                entityType: {
                  contains: input.entityType,
                  mode: "insensitive",
                },
              }
            : {}),
          ...(input.query
            ? {
                OR: [
                  {
                    action: {
                      contains: input.query,
                      mode: "insensitive",
                    },
                  },
                  {
                    entityType: {
                      contains: input.query,
                      mode: "insensitive",
                    },
                  },
                  {
                    entityId: {
                      contains: input.query,
                      mode: "insensitive",
                    },
                  },
                ],
              }
            : {}),
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        ...(input.cursor
          ? {
              cursor: {
                id: input.cursor,
              },
              skip: 1,
            }
          : {}),
        take,
        include: {
          adminUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
    [],
  );

  const hasNextPage = rows.length > input.limit;
  const items = hasNextPage ? rows.slice(0, -1) : rows;

  return {
    items: items.map((item) => ({
      id: item.id,
      action: item.action,
      entityType: item.entityType,
      entityId: item.entityId,
      metadata: item.metadata,
      createdAt: item.createdAt,
      admin: {
        id: item.adminUser.id,
        name:
          `${item.adminUser.firstName ?? ""} ${item.adminUser.lastName ?? ""}`.trim() ||
          item.adminUser.email,
        email: item.adminUser.email,
      },
    })),
    nextCursor: hasNextPage ? items[items.length - 1]?.id : null,
  };
}

export async function getRecentActivityFeed(db: PrismaClient, limit: number) {
  const [adminActions, publicActivity, recentPublished] = await Promise.all([
    getRecentAdminActions(db, limit),
    getRecentPublicActivity(db, limit),
    getRecentPublished(db, limit),
  ]);

  const adminItems = adminActions.map((item) => ({
    id: item.id,
    kind: "ADMIN_ACTION" as const,
    occurredAt: item.createdAt,
    title: item.action,
    description: `${item.entityType} (${item.entityId})`,
    href: "/admin/audit-logs",
  }));

  const publicItems = publicActivity.map((item) => ({
    id: item.id,
    kind: item.type,
    occurredAt: item.occurredAt,
    title: item.targetTitle,
    description:
      item.type === "COMMENT"
        ? `${item.actorLabel} commented`
        : `${item.actorLabel} submitted quiz attempt`,
    href: item.href,
  }));

  const publishedItems = recentPublished.map((item) => ({
    id: item.id,
    kind: "PUBLISHED" as const,
    occurredAt: item.publishedAt,
    title: item.title,
    description: `${item.kind.toLowerCase()} published`,
    href: item.href,
  }));

  return [...adminItems, ...publicItems, ...publishedItems]
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, limit);
}
