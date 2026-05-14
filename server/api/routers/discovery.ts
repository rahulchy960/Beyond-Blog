import { Prisma, type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  CONTENT_TYPE,
  COURSE_STATUS,
  PUBLISH_STATUS,
  QUIZ_STATUS,
  type ContentType,
  type CourseDifficultyLevel,
} from "@/lib/content/enums";
import {
  adminCreateCategoryInputSchema,
  adminCreateTagInputSchema,
  adminDeleteCategoryInputSchema,
  adminDeleteTagInputSchema,
  adminTaxonomyListInputSchema,
  adminUpdateCategoryInputSchema,
  adminUpdateTagInputSchema,
  homepageDiscoveryInputSchema,
  normalizeOptionalText,
  publicContentDiscoveryInputSchema,
  publicCourseDiscoveryInputSchema,
  publicQuizDiscoveryInputSchema,
  publicSearchInputSchema,
  relatedContentInputSchema,
  taxonomyBySlugInputSchema,
} from "@/lib/discovery/schemas";
import { slugifyText } from "@/lib/content/slug";
import { createTRPCRouter, adminProcedure, publicProcedure } from "@/server/api/trpc";
import { createAuditLog } from "@/server/audit/log";
import { revalidatePublicIndexes, revalidateTaxonomyPaths } from "@/lib/cache/revalidate";

const contentListInclude = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  coverImage: {
    select: {
      id: true,
      url: true,
      thumbnailUrl: true,
      altText: true,
    },
  },
  tags: {
    select: {
      tag: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    take: 8,
  },
} as const;

const courseCoverSelect = {
  id: true,
  url: true,
  thumbnailUrl: true,
  altText: true,
} as const;

const quizDiscoverySelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  isFeatured: true,
  timeLimitMinutes: true,
  passingScore: true,
  publishedAt: true,
  updatedAt: true,
} as const;

type SearchItem = {
  id: string;
  type: "JOURNAL" | "ARTICLE" | "PROJECT" | "COURSE" | "QUIZ";
  title: string;
  slug: string;
  href: string;
  summary: string | null;
  isFeatured: boolean;
  publishedAt: Date | null;
  coverImage: {
    url: string;
    thumbnailUrl: string | null;
    altText: string | null;
  } | null;
  category: {
    name: string;
    slug: string;
  } | null;
  tags: Array<{ name: string; slug: string }>;
  meta: {
    lessonCount?: number;
    questionCount?: number;
    difficulty?: CourseDifficultyLevel | null;
    attemptsCount?: number;
    sectionsCount?: number;
  };
};

function isMissingTableError(error: unknown, names: string[]) {
  const message = String(error ?? "");
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("the column `(not available)` does not exist") ||
    lowerMessage.includes("does not exist in the current database") ||
    (lowerMessage.includes("column") && lowerMessage.includes("does not exist"))
  ) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021" || error.code === "P2022") {
      return names.some((name) => message.includes(name));
    }
    if (error.code === "P2010") {
      return names.some((name) => message.includes(name));
    }
  }
  return false;
}

let discoveryQuizReadSchemaState: "unknown" | "ready" | "missing" = "unknown";
let discoveryCourseReadSchemaState: "unknown" | "ready" | "missing" = "unknown";

async function hasDiscoveryQuizReadSchema(db: Pick<PrismaClient, "$queryRaw">) {
  if (discoveryQuizReadSchemaState === "ready") return true;
  if (discoveryQuizReadSchemaState === "missing") return false;

  try {
    const rows = await db.$queryRaw<Array<{ columnName: string }>>`
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
    `;

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
    discoveryQuizReadSchemaState = ready ? "ready" : "missing";
    return ready;
  } catch {
    discoveryQuizReadSchemaState = "missing";
    return false;
  }
}

async function hasDiscoveryCourseReadSchema(db: Pick<PrismaClient, "$queryRaw">) {
  if (discoveryCourseReadSchemaState === "ready") return true;
  if (discoveryCourseReadSchemaState === "missing") return false;

  try {
    const rows = await db.$queryRaw<Array<{ columnName: string }>>`
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
    `;

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
    discoveryCourseReadSchemaState = ready ? "ready" : "missing";
    return ready;
  } catch {
    discoveryCourseReadSchemaState = "missing";
    return false;
  }
}

function getTextScore(text: string | null | undefined, query: string) {
  if (!text) return 0;
  const value = text.toLowerCase();
  if (value === query) return 120;
  if (value.startsWith(query)) return 95;
  if (value.includes(query)) return 70;
  return 0;
}

function getSearchScore(item: SearchItem, query?: string) {
  const recency = item.publishedAt ? new Date(item.publishedAt).getTime() / 1e12 : 0;
  const featuredScore = item.isFeatured ? 120 : 0;
  if (!query) {
    return featuredScore + recency;
  }

  const tagText = item.tags.map((tag) => tag.name).join(" ").toLowerCase();
  const categoryText = item.category?.name?.toLowerCase() ?? "";

  return (
    featuredScore +
    recency +
    getTextScore(item.title, query) * 1.4 +
    getTextScore(item.summary, query) +
    getTextScore(tagText, query) +
    getTextScore(categoryText, query)
  );
}

function orderBySort(sort: "newest" | "oldest") {
  return sort === "oldest"
    ? [{ publishedAt: "asc" as const }, { createdAt: "asc" as const }]
    : [{ publishedAt: "desc" as const }, { updatedAt: "desc" as const }];
}

function getPageInfo(page: number, pageSize: number, total: number) {
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1;
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}

function toContentSearchItem(item: {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  summary: string | null;
  isFeatured: boolean;
  publishedAt: Date | null;
  coverImage: {
    url: string;
    thumbnailUrl: string | null;
    altText: string | null;
  } | null;
  category: { name: string; slug: string } | null;
  tags: Array<{ tag: { name: string; slug: string } }>;
}): SearchItem {
  const href =
    item.type === CONTENT_TYPE.JOURNAL
      ? `/journals/${item.slug}`
      : item.type === CONTENT_TYPE.ARTICLE
        ? `/articles/${item.slug}`
        : `/projects/${item.slug}`;

  return {
    id: item.id,
    type: item.type,
    title: item.title,
    slug: item.slug,
    href,
    summary: item.summary,
    isFeatured: item.isFeatured,
    publishedAt: item.publishedAt,
    coverImage: item.coverImage,
    category: item.category,
    tags: item.tags.map((entry) => ({ name: entry.tag.name, slug: entry.tag.slug })),
    meta: {},
  };
}

function getTopTagFacet(
  items: Array<{
    tags: Array<{ tag: { id: string; name: string; slug: string } }>;
  }>,
  limit = 12,
) {
  const map = new Map<string, { id: string; name: string; slug: string; count: number }>();

  for (const item of items) {
    for (const link of item.tags) {
      const key = link.tag.id;
      const current = map.get(key);
      if (!current) {
        map.set(key, { ...link.tag, count: 1 });
        continue;
      }
      current.count += 1;
    }
  }

  return Array.from(map.values())
    .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.name.localeCompare(b.name)))
    .slice(0, limit);
}

function getTopCategoryFacet(
  items: Array<{
    category: { id: string; name: string; slug: string } | null;
  }>,
  limit = 12,
) {
  const map = new Map<string, { id: string; name: string; slug: string; count: number }>();

  for (const item of items) {
    if (!item.category) continue;
    const current = map.get(item.category.id);
    if (!current) {
      map.set(item.category.id, { ...item.category, count: 1 });
      continue;
    }
    current.count += 1;
  }

  return Array.from(map.values())
    .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.name.localeCompare(b.name)))
    .slice(0, limit);
}

async function assertCategorySlugUnique(args: {
  db: {
    category: {
      findFirst: (params: {
        where: { slug: string; id?: { not: string } };
        select: { id: true };
      }) => Promise<{ id: string } | null>;
    };
  };
  slug: string;
  excludeId?: string;
}) {
  const existing = await args.db.category.findFirst({
    where: {
      slug: args.slug,
      ...(args.excludeId ? { id: { not: args.excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Another category already uses this slug.",
    });
  }
}

async function assertTagSlugUnique(args: {
  db: {
    tag: {
      findFirst: (params: {
        where: { slug: string; id?: { not: string } };
        select: { id: true };
      }) => Promise<{ id: string } | null>;
    };
  };
  slug: string;
  excludeId?: string;
}) {
  const existing = await args.db.tag.findFirst({
    where: {
      slug: args.slug,
      ...(args.excludeId ? { id: { not: args.excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Another tag already uses this slug.",
    });
  }
}

function normalizeCategoryInput(input: {
  name: string;
  slug?: string;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}) {
  const name = input.name.trim();
  const preferredSlug = input.slug?.trim();
  const slug = slugifyText(preferredSlug && preferredSlug.length > 0 ? preferredSlug : name);
  if (!slug) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Category slug is invalid.",
    });
  }

  return {
    name,
    slug,
    description: normalizeOptionalText(input.description),
    isActive: input.isActive ?? true,
    sortOrder: input.sortOrder ?? 0,
  };
}

function normalizeTagInput(input: { name: string; slug?: string }) {
  const name = input.name.trim();
  const preferredSlug = input.slug?.trim();
  const slug = slugifyText(preferredSlug && preferredSlug.length > 0 ? preferredSlug : name);

  if (!slug) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Tag slug is invalid.",
    });
  }

  return { name, slug };
}

export const discoveryRouter = createTRPCRouter({
  search: publicProcedure.input(publicSearchInputSchema).query(async ({ ctx, input }) => {
    const requestedWindow = input.page * input.pageSize + input.pageSize;
    const effectiveLimit = Math.min(180, Math.max(input.limit, requestedWindow));
    const query = input.query?.trim().toLowerCase();
    const perTypeLimit =
      input.scope === "ALL" ? Math.max(8, Math.ceil(effectiveLimit / 3) + 4) : effectiveLimit;

    const shouldLoadContent = ["ALL", "JOURNAL", "ARTICLE", "PROJECT"].includes(input.scope);
    const [courseReadable, quizReadable] = await Promise.all([
      ["ALL", "COURSE"].includes(input.scope)
        ? hasDiscoveryCourseReadSchema(ctx.db)
        : Promise.resolve(false),
      ["ALL", "QUIZ"].includes(input.scope)
        ? hasDiscoveryQuizReadSchema(ctx.db)
        : Promise.resolve(false),
    ]);
    const shouldLoadCourses = ["ALL", "COURSE"].includes(input.scope) && courseReadable;
    const shouldLoadQuizzes = ["ALL", "QUIZ"].includes(input.scope) && quizReadable;

    const contentTypes =
      input.scope === "JOURNAL"
        ? [CONTENT_TYPE.JOURNAL]
        : input.scope === "ARTICLE"
          ? [CONTENT_TYPE.ARTICLE]
          : input.scope === "PROJECT"
            ? [CONTENT_TYPE.PROJECT]
            : [CONTENT_TYPE.JOURNAL, CONTENT_TYPE.ARTICLE, CONTENT_TYPE.PROJECT];

    const [contentResult, courseResult, quizResult] = await Promise.allSettled([
      shouldLoadContent
        ? ctx.db.content.findMany({
            where: {
              publishStatus: PUBLISH_STATUS.PUBLISHED,
              type: { in: contentTypes },
              ...(input.category ? { category: { is: { slug: input.category } } } : {}),
              ...(input.tag ? { tags: { some: { tag: { slug: input.tag } } } } : {}),
              ...(input.featuredOnly ? { isFeatured: true } : {}),
              ...(query
                ? {
                    OR: [
                      { title: { contains: query, mode: "insensitive" } },
                      { summary: { contains: query, mode: "insensitive" } },
                      { tags: { some: { tag: { name: { contains: query, mode: "insensitive" } } } } },
                      { category: { is: { name: { contains: query, mode: "insensitive" } } } },
                    ],
                  }
                : {}),
            },
            orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
            take: perTypeLimit,
            include: contentListInclude,
          })
        : Promise.resolve([]),
      shouldLoadCourses
        ? ctx.db.course.findMany({
            where: {
              status: COURSE_STATUS.PUBLISHED,
              ...(input.featuredOnly ? { isFeatured: true } : {}),
              ...(input.difficulty ? { difficultyLevel: input.difficulty } : {}),
              ...(query
                ? {
                    OR: [
                      { title: { contains: query, mode: "insensitive" } },
                      { summary: { contains: query, mode: "insensitive" } },
                      { descriptionHtml: { contains: query, mode: "insensitive" } },
                    ],
                  }
                : {}),
            },
            orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
            take: perTypeLimit,
            include: {
              coverImage: { select: courseCoverSelect },
              _count: { select: { lessons: true, sections: true } },
            },
          })
        : Promise.resolve([]),
      shouldLoadQuizzes
        ? ctx.db.quiz.findMany({
            where: {
              status: QUIZ_STATUS.PUBLISHED,
              ...(input.featuredOnly ? { isFeatured: true } : {}),
              ...(query
                ? {
                    OR: [
                      { title: { contains: query, mode: "insensitive" } },
                      { description: { contains: query, mode: "insensitive" } },
                    ],
                  }
                : {}),
            },
            orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
            take: perTypeLimit,
            select: quizDiscoverySelect,
          })
        : Promise.resolve([]),
    ]);

    if (contentResult.status === "rejected") {
      throw contentResult.reason;
    }

    if (
      courseResult.status === "rejected" &&
      !isMissingTableError(courseResult.reason, ["Course"])
    ) {
      throw courseResult.reason;
    }

    if (
      quizResult.status === "rejected" &&
      !isMissingTableError(quizResult.reason, ["Quiz"])
    ) {
      throw quizResult.reason;
    }

    const contentItems = contentResult.value.map((item) => toContentSearchItem(item));
    const courseItems =
      courseResult.status === "fulfilled"
        ? courseResult.value.map(
            (course): SearchItem => ({
              id: course.id,
              type: "COURSE",
              title: course.title,
              slug: course.slug,
              href: `/courses/${course.slug}`,
              summary: course.summary,
              isFeatured: course.isFeatured,
              publishedAt: course.publishedAt,
              coverImage: course.coverImage,
              category: null,
              tags: [],
              meta: {
                difficulty: course.difficultyLevel,
                lessonCount: course._count.lessons,
                sectionsCount: course._count.sections,
              },
            }),
          )
        : [];

    const quizItems =
      quizResult.status === "fulfilled"
        ? quizResult.value.map(
            (quiz): SearchItem => ({
              id: quiz.id,
              type: "QUIZ",
              title: quiz.title,
              slug: quiz.slug,
              href: `/quizzes/${quiz.slug}`,
              summary: quiz.description,
              isFeatured: quiz.isFeatured,
              publishedAt: quiz.publishedAt,
              coverImage: null,
              category: null,
              tags: [],
              meta: {
                questionCount: 0,
                attemptsCount: 0,
              },
            }),
          )
        : [];

    const merged = [...contentItems, ...courseItems, ...quizItems];
    const sorted = [...merged].sort((a, b) => {
      if (input.sort === "newest") {
        return (b.publishedAt ? new Date(b.publishedAt).getTime() : 0) -
          (a.publishedAt ? new Date(a.publishedAt).getTime() : 0);
      }

      const scoreB = getSearchScore(b, query);
      const scoreA = getSearchScore(a, query);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (b.publishedAt ? new Date(b.publishedAt).getTime() : 0) -
        (a.publishedAt ? new Date(a.publishedAt).getTime() : 0);
    });

    const total = sorted.length;
    const start = (input.page - 1) * input.pageSize;
    const items = sorted.slice(start, start + input.pageSize);
    const counts = {
      JOURNAL: sorted.filter((item) => item.type === "JOURNAL").length,
      ARTICLE: sorted.filter((item) => item.type === "ARTICLE").length,
      PROJECT: sorted.filter((item) => item.type === "PROJECT").length,
      COURSE: sorted.filter((item) => item.type === "COURSE").length,
      QUIZ: sorted.filter((item) => item.type === "QUIZ").length,
    };

    return {
      query: input.query ?? "",
      scope: input.scope,
      items,
      counts,
      total,
      pageInfo: getPageInfo(input.page, input.pageSize, total),
    };
  }),

  listContent: publicProcedure
    .input(publicContentDiscoveryInputSchema)
    .query(async ({ ctx, input }) => {
      const where = {
        type: input.type,
        publishStatus: PUBLISH_STATUS.PUBLISHED,
        ...(input.featuredOnly ? { isFeatured: true } : {}),
        ...(input.category ? { category: { is: { slug: input.category } } } : {}),
        ...(input.tag ? { tags: { some: { tag: { slug: input.tag } } } } : {}),
        ...(input.query
          ? {
              OR: [
                { title: { contains: input.query, mode: "insensitive" as const } },
                { summary: { contains: input.query, mode: "insensitive" as const } },
                { tags: { some: { tag: { name: { contains: input.query, mode: "insensitive" as const } } } } },
              ],
            }
          : {}),
      };

      const [items, total, facetSource] = await Promise.all([
        ctx.db.content.findMany({
          where,
          orderBy: orderBySort(input.sort),
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          include: contentListInclude,
        }),
        ctx.db.content.count({ where }),
        ctx.db.content.findMany({
          where: {
            type: input.type,
            publishStatus: PUBLISH_STATUS.PUBLISHED,
          },
          select: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            tags: {
              select: {
                tag: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
          take: 300,
        }),
      ]);

      return {
        items,
        pageInfo: getPageInfo(input.page, input.pageSize, total),
        facets: {
          categories: getTopCategoryFacet(facetSource, 16),
          tags: getTopTagFacet(facetSource, 20),
        },
      };
    }),

  listCourses: publicProcedure
    .input(publicCourseDiscoveryInputSchema)
    .query(async ({ ctx, input }) => {
      if (!(await hasDiscoveryCourseReadSchema(ctx.db))) {
        return {
          items: [],
          pageInfo: getPageInfo(input.page, input.pageSize, 0),
          facets: {
            difficultyCounts: {},
          },
        };
      }

      try {
        const where = {
          status: COURSE_STATUS.PUBLISHED,
          ...(input.featuredOnly ? { isFeatured: true } : {}),
          ...(input.difficulty ? { difficultyLevel: input.difficulty } : {}),
          ...(input.query
            ? {
                OR: [
                  { title: { contains: input.query, mode: "insensitive" as const } },
                  { summary: { contains: input.query, mode: "insensitive" as const } },
                  { descriptionHtml: { contains: input.query, mode: "insensitive" as const } },
                ],
              }
            : {}),
        };

        const [items, total, difficultyGroups] = await Promise.all([
          ctx.db.course.findMany({
            where,
            orderBy: orderBySort(input.sort),
            skip: (input.page - 1) * input.pageSize,
            take: input.pageSize,
            include: {
              coverImage: {
                select: courseCoverSelect,
              },
              _count: {
                select: {
                  sections: true,
                  lessons: true,
                },
              },
            },
          }),
          ctx.db.course.count({ where }),
          ctx.db.course.groupBy({
            by: ["difficultyLevel"],
            where,
            _count: {
              _all: true,
            },
          }),
        ]);

        const difficultyCounts = difficultyGroups.reduce<Record<string, number>>((acc, group) => {
          const key = group.difficultyLevel ?? "UNSPECIFIED";
          acc[key] = (acc[key] ?? 0) + group._count._all;
          return acc;
        }, {});

        return {
          items,
          pageInfo: getPageInfo(input.page, input.pageSize, total),
          facets: {
            difficultyCounts,
          },
        };
      } catch (error) {
        if (isMissingTableError(error, ["Course"])) {
          return {
            items: [],
            pageInfo: getPageInfo(input.page, input.pageSize, 0),
            facets: {
              difficultyCounts: {},
            },
          };
        }
        throw error;
      }
    }),

  listQuizzes: publicProcedure
    .input(publicQuizDiscoveryInputSchema)
    .query(async ({ ctx, input }) => {
      if (!(await hasDiscoveryQuizReadSchema(ctx.db))) {
        return {
          items: [],
          pageInfo: getPageInfo(input.page, input.pageSize, 0),
        };
      }

      try {
        const where = {
          status: QUIZ_STATUS.PUBLISHED,
          ...(input.featuredOnly ? { isFeatured: true } : {}),
          ...(input.query
            ? {
                OR: [
                  { title: { contains: input.query, mode: "insensitive" as const } },
                  { description: { contains: input.query, mode: "insensitive" as const } },
                ],
              }
            : {}),
        };

        const [items, total] = await Promise.all([
          ctx.db.quiz.findMany({
            where,
            orderBy: orderBySort(input.sort),
            skip: (input.page - 1) * input.pageSize,
            take: input.pageSize,
            select: quizDiscoverySelect,
          }),
          ctx.db.quiz.count({ where }),
        ]);

        return {
          items: items.map((item) => ({
            ...item,
            coverImage: null,
            _count: {
              questions: 0,
              attempts: 0,
            },
          })),
          pageInfo: getPageInfo(input.page, input.pageSize, total),
        };
      } catch (error) {
        if (isMissingTableError(error, ["Quiz"])) {
          return {
            items: [],
            pageInfo: getPageInfo(input.page, input.pageSize, 0),
          };
        }
        throw error;
      }
    }),

  getTagPage: publicProcedure.input(taxonomyBySlugInputSchema).query(async ({ ctx, input }) => {
    const tag = await ctx.db.tag.findUnique({
      where: { slug: input.slug },
      include: {
        _count: {
          select: { contentTags: true },
        },
      },
    });

    if (!tag) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Tag not found.",
      });
    }

    const where = {
      publishStatus: PUBLISH_STATUS.PUBLISHED,
      tags: {
        some: {
          tagId: tag.id,
        },
      },
    };

    const [items, total] = await Promise.all([
      ctx.db.content.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: contentListInclude,
      }),
      ctx.db.content.count({ where }),
    ]);

    return {
      tag: {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        usageCount: tag._count.contentTags,
      },
      items,
      pageInfo: getPageInfo(input.page, input.pageSize, total),
    };
  }),

  getCategoryPage: publicProcedure
    .input(taxonomyBySlugInputSchema)
    .query(async ({ ctx, input }) => {
      const category = await ctx.db.category.findUnique({
        where: { slug: input.slug },
        include: {
          _count: {
            select: { contents: true },
          },
        },
      });

      if (!category || !category.isActive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found.",
        });
      }

      const where = {
        publishStatus: PUBLISH_STATUS.PUBLISHED,
        categoryId: category.id,
      };

      const [items, total] = await Promise.all([
        ctx.db.content.findMany({
          where,
          orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          include: contentListInclude,
        }),
        ctx.db.content.count({ where }),
      ]);

      return {
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          usageCount: category._count.contents,
        },
        items,
        pageInfo: getPageInfo(input.page, input.pageSize, total),
      };
    }),

  relatedByTarget: publicProcedure
    .input(relatedContentInputSchema)
    .query(async ({ ctx, input }) => {
      if (input.targetType === "CONTENT") {
        const current = await ctx.db.content.findFirst({
          where: {
            slug: input.slug,
            publishStatus: PUBLISH_STATUS.PUBLISHED,
          },
          select: {
            id: true,
            type: true,
            categoryId: true,
            tags: {
              select: {
                tagId: true,
              },
            },
          },
        });

        if (!current) return { items: [] as SearchItem[] };

        const tagIds = current.tags.map((item) => item.tagId);
        const related = await ctx.db.content.findMany({
          where: {
            id: { not: current.id },
            publishStatus: PUBLISH_STATUS.PUBLISHED,
            OR: [
              { type: current.type },
              ...(current.categoryId ? [{ categoryId: current.categoryId }] : []),
              ...(tagIds.length > 0 ? [{ tags: { some: { tagId: { in: tagIds } } } }] : []),
            ],
          },
          orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
          take: input.limit,
          include: contentListInclude,
        });

        return {
          items: related.map((item) => toContentSearchItem(item)),
        };
      }

      if (input.targetType === "COURSE") {
        if (!(await hasDiscoveryCourseReadSchema(ctx.db))) {
          return { items: [] as SearchItem[] };
        }

        try {
          const current = await ctx.db.course.findFirst({
            where: {
              slug: input.slug,
              status: COURSE_STATUS.PUBLISHED,
            },
            select: {
              id: true,
              difficultyLevel: true,
            },
          });

          if (!current) return { items: [] as SearchItem[] };

          const related = await ctx.db.course.findMany({
            where: {
              id: { not: current.id },
              status: COURSE_STATUS.PUBLISHED,
              OR: [
                ...(current.difficultyLevel
                  ? [{ difficultyLevel: current.difficultyLevel }]
                  : []),
                { isFeatured: true },
              ],
            },
            orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
            take: input.limit,
            include: {
              coverImage: {
                select: courseCoverSelect,
              },
              _count: {
                select: {
                  lessons: true,
                  sections: true,
                },
              },
            },
          });

          return {
            items: related.map(
              (item): SearchItem => ({
                id: item.id,
                type: "COURSE",
                title: item.title,
                slug: item.slug,
                href: `/courses/${item.slug}`,
                summary: item.summary,
                isFeatured: item.isFeatured,
                publishedAt: item.publishedAt,
                coverImage: item.coverImage,
                category: null,
                tags: [],
                meta: {
                  difficulty: item.difficultyLevel,
                  lessonCount: item._count.lessons,
                  sectionsCount: item._count.sections,
                },
              }),
            ),
          };
        } catch (error) {
          if (isMissingTableError(error, ["Course"])) {
            return { items: [] as SearchItem[] };
          }
          throw error;
        }
      }

      if (!(await hasDiscoveryQuizReadSchema(ctx.db))) {
        return { items: [] as SearchItem[] };
      }

      try {
        const current = await ctx.db.quiz.findFirst({
          where: {
            slug: input.slug,
            status: {
              in: [QUIZ_STATUS.PUBLISHED, QUIZ_STATUS.CLOSED],
            },
          },
          select: {
            id: true,
          },
        });

        if (!current) return { items: [] as SearchItem[] };

        const related = await ctx.db.quiz.findMany({
          where: {
            id: { not: current.id },
            status: QUIZ_STATUS.PUBLISHED,
          },
          orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
          take: input.limit,
          select: quizDiscoverySelect,
        });

        return {
          items: related.map(
            (item): SearchItem => ({
              id: item.id,
              type: "QUIZ",
              title: item.title,
              slug: item.slug,
              href: `/quizzes/${item.slug}`,
              summary: item.description,
              isFeatured: item.isFeatured,
              publishedAt: item.publishedAt,
              coverImage: null,
              category: null,
              tags: [],
              meta: {
                questionCount: 0,
                attemptsCount: 0,
              },
            }),
          ),
        };
      } catch (error) {
        if (isMissingTableError(error, ["Quiz"])) {
          return { items: [] as SearchItem[] };
        }
        throw error;
      }
    }),

  homepageSections: publicProcedure
    .input(homepageDiscoveryInputSchema)
    .query(async ({ ctx, input }) => {
      const [featuredContent, recentContent] = await Promise.all([
        ctx.db.content.findMany({
          where: {
            publishStatus: PUBLISH_STATUS.PUBLISHED,
            isFeatured: true,
          },
          orderBy: [{ publishedAt: "desc" }],
          take: input.featuredLimit,
          include: contentListInclude,
        }),
        ctx.db.content.findMany({
          where: {
            publishStatus: PUBLISH_STATUS.PUBLISHED,
          },
          orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
          take: Math.max(input.recentLimit, 16),
          include: contentListInclude,
        }),
      ]);
      const [courseReadable, quizReadable] = await Promise.all([
        hasDiscoveryCourseReadSchema(ctx.db),
        hasDiscoveryQuizReadSchema(ctx.db),
      ]);

      const [featuredCoursesResult, recentCoursesResult, featuredQuizzesResult, recentQuizzesResult] =
        await Promise.allSettled([
          courseReadable
            ? ctx.db.course.findMany({
                where: {
                  status: COURSE_STATUS.PUBLISHED,
                  isFeatured: true,
                },
                orderBy: [{ publishedAt: "desc" }],
                take: input.featuredLimit,
                include: {
                  coverImage: { select: courseCoverSelect },
                  _count: { select: { lessons: true, sections: true } },
                },
              })
            : Promise.resolve([]),
          courseReadable
            ? ctx.db.course.findMany({
                where: {
                  status: COURSE_STATUS.PUBLISHED,
                },
                orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
                take: input.recentLimit,
                include: {
                  coverImage: { select: courseCoverSelect },
                  _count: { select: { lessons: true, sections: true } },
                },
              })
            : Promise.resolve([]),
          quizReadable
            ? ctx.db.quiz.findMany({
                where: {
                  status: QUIZ_STATUS.PUBLISHED,
                  isFeatured: true,
                },
                orderBy: [{ publishedAt: "desc" }],
                take: input.featuredLimit,
                select: quizDiscoverySelect,
              })
            : Promise.resolve([]),
          quizReadable
            ? ctx.db.quiz.findMany({
                where: {
                  status: QUIZ_STATUS.PUBLISHED,
                },
                orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
                take: input.recentLimit,
                select: quizDiscoverySelect,
              })
            : Promise.resolve([]),
        ]);

      const featuredCourses =
        featuredCoursesResult.status === "fulfilled" ? featuredCoursesResult.value : [];
      const recentCourses =
        recentCoursesResult.status === "fulfilled" ? recentCoursesResult.value : [];
      const featuredQuizzes =
        featuredQuizzesResult.status === "fulfilled" ? featuredQuizzesResult.value : [];
      const recentQuizzes =
        recentQuizzesResult.status === "fulfilled" ? recentQuizzesResult.value : [];

      const normalizedFeaturedQuizzes = featuredQuizzes.map((quiz) => ({
        ...quiz,
        coverImage: null,
        _count: {
          questions: 0,
          attempts: 0,
        },
      }));

      const recentMixed: SearchItem[] = [
        ...recentContent.map((item) => toContentSearchItem(item)),
        ...recentCourses.map(
          (course): SearchItem => ({
            id: course.id,
            type: "COURSE",
            title: course.title,
            slug: course.slug,
            href: `/courses/${course.slug}`,
            summary: course.summary,
            isFeatured: course.isFeatured,
            publishedAt: course.publishedAt,
            coverImage: course.coverImage,
            category: null,
            tags: [],
            meta: {
              difficulty: course.difficultyLevel,
              lessonCount: course._count.lessons,
              sectionsCount: course._count.sections,
            },
          }),
        ),
        ...recentQuizzes.map(
          (quiz): SearchItem => ({
            id: quiz.id,
            type: "QUIZ",
            title: quiz.title,
            slug: quiz.slug,
            href: `/quizzes/${quiz.slug}`,
            summary: quiz.description,
            isFeatured: quiz.isFeatured,
            publishedAt: quiz.publishedAt,
            coverImage: null,
            category: null,
            tags: [],
            meta: {
              questionCount: 0,
              attemptsCount: 0,
            },
          }),
        ),
      ]
        .sort(
          (a, b) =>
            (b.publishedAt ? new Date(b.publishedAt).getTime() : 0) -
            (a.publishedAt ? new Date(a.publishedAt).getTime() : 0),
        )
        .slice(0, input.recentLimit);

      return {
        featuredContent,
        featuredCourses,
        featuredQuizzes: normalizedFeaturedQuizzes,
        recentMixed,
        discoveryTags: getTopTagFacet(recentContent, 10),
        discoveryCategories: getTopCategoryFacet(recentContent, 8),
      };
    }),

  listTagsAdmin: adminProcedure
    .input(adminTaxonomyListInputSchema)
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.tag.findMany({
        where: input.query
          ? {
              OR: [
                { name: { contains: input.query, mode: "insensitive" } },
                { slug: { contains: input.query, mode: "insensitive" } },
              ],
            }
          : undefined,
        orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
        take: input.limit,
        include: {
          _count: {
            select: {
              contentTags: true,
            },
          },
        },
      });

      return { items };
    }),

  createTag: adminProcedure.input(adminCreateTagInputSchema).mutation(async ({ ctx, input }) => {
    const data = normalizeTagInput(input);
    await assertTagSlugUnique({ db: ctx.db, slug: data.slug });

    const tag = await ctx.db.tag.create({
      data,
      include: {
        _count: {
          select: {
            contentTags: true,
          },
        },
      },
    });

    await createAuditLog({
      db: ctx.db,
      adminUserId: ctx.adminUser.id,
      action: "taxonomy.tag.create",
      entityType: "TAG",
      entityId: tag.id,
      metadata: {
        name: tag.name,
        slug: tag.slug,
      },
    });

    revalidatePublicIndexes();
    revalidateTaxonomyPaths({
      tagSlugs: [tag.slug],
    });

    return tag;
  }),

  updateTag: adminProcedure.input(adminUpdateTagInputSchema).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db.tag.findUnique({
      where: { id: input.id },
      select: { id: true, slug: true },
    });
    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Tag not found.",
      });
    }

    const data = normalizeTagInput(input);
    await assertTagSlugUnique({ db: ctx.db, slug: data.slug, excludeId: input.id });

    const updated = await ctx.db.tag.update({
      where: { id: input.id },
      data,
      include: {
        _count: {
          select: {
            contentTags: true,
          },
        },
      },
    });

    await createAuditLog({
      db: ctx.db,
      adminUserId: ctx.adminUser.id,
      action: "taxonomy.tag.update",
      entityType: "TAG",
      entityId: updated.id,
      metadata: {
        name: updated.name,
        slug: updated.slug,
      },
    });

    revalidatePublicIndexes();
    revalidateTaxonomyPaths({
      tagSlugs: [existing.slug, updated.slug],
    });

    return updated;
  }),

  deleteTag: adminProcedure.input(adminDeleteTagInputSchema).mutation(async ({ ctx, input }) => {
    const current = await ctx.db.tag.findUnique({
      where: { id: input.id },
      include: {
        _count: {
          select: {
            contentTags: true,
          },
        },
      },
    });

    if (!current) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Tag not found.",
      });
    }

    if (current._count.contentTags > 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Tag is in use. Remove it from content before deleting.",
      });
    }

    await ctx.db.tag.delete({
      where: { id: input.id },
    });

    await createAuditLog({
      db: ctx.db,
      adminUserId: ctx.adminUser.id,
      action: "taxonomy.tag.delete",
      entityType: "TAG",
      entityId: input.id,
      metadata: {
        name: current.name,
        slug: current.slug,
      },
    });

    revalidatePublicIndexes();
    revalidateTaxonomyPaths({
      tagSlugs: [current.slug],
    });

    return { id: input.id };
  }),

  listCategoriesAdmin: adminProcedure
    .input(adminTaxonomyListInputSchema)
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.category.findMany({
        where: input.query
          ? {
              OR: [
                { name: { contains: input.query, mode: "insensitive" } },
                { slug: { contains: input.query, mode: "insensitive" } },
                { description: { contains: input.query, mode: "insensitive" } },
              ],
            }
          : undefined,
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        take: input.limit,
        include: {
          _count: {
            select: {
              contents: true,
            },
          },
        },
      });

      return { items };
    }),

  createCategory: adminProcedure
    .input(adminCreateCategoryInputSchema)
    .mutation(async ({ ctx, input }) => {
      const data = normalizeCategoryInput(input);
      await assertCategorySlugUnique({
        db: ctx.db,
        slug: data.slug,
      });

      const category = await ctx.db.category.create({
        data,
        include: {
          _count: {
            select: {
              contents: true,
            },
          },
        },
      });

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "taxonomy.category.create",
        entityType: "CATEGORY",
        entityId: category.id,
        metadata: {
          name: category.name,
          slug: category.slug,
        },
      });

      revalidatePublicIndexes();
      revalidateTaxonomyPaths({
        categorySlug: category.slug,
      });

      return category;
    }),

  updateCategory: adminProcedure
    .input(adminUpdateCategoryInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.category.findUnique({
        where: { id: input.id },
        select: { id: true, slug: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found.",
        });
      }

      const data = normalizeCategoryInput(input);
      await assertCategorySlugUnique({
        db: ctx.db,
        slug: data.slug,
        excludeId: input.id,
      });

      const updated = await ctx.db.category.update({
        where: { id: input.id },
        data,
        include: {
          _count: {
            select: {
              contents: true,
            },
          },
        },
      });

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "taxonomy.category.update",
        entityType: "CATEGORY",
        entityId: updated.id,
        metadata: {
          name: updated.name,
          slug: updated.slug,
        },
      });

      revalidatePublicIndexes();
      revalidateTaxonomyPaths({
        categorySlug: updated.slug,
      });
      if (existing.slug !== updated.slug) {
        revalidateTaxonomyPaths({
          categorySlug: existing.slug,
        });
      }

      return updated;
    }),

  deleteCategory: adminProcedure
    .input(adminDeleteCategoryInputSchema)
    .mutation(async ({ ctx, input }) => {
      const current = await ctx.db.category.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              contents: true,
            },
          },
        },
      });

      if (!current) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found.",
        });
      }

      if (current._count.contents > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Category is in use by published or draft content.",
        });
      }

      await ctx.db.category.delete({
        where: { id: input.id },
      });

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "taxonomy.category.delete",
        entityType: "CATEGORY",
        entityId: input.id,
        metadata: {
          name: current.name,
          slug: current.slug,
        },
      });

      revalidatePublicIndexes();
      revalidateTaxonomyPaths({
        categorySlug: current.slug,
      });

      return { id: input.id };
    }),
});
