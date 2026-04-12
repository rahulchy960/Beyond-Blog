import { Prisma } from "@prisma/client";
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

const quizCoverSelect = {
  id: true,
  url: true,
  thumbnailUrl: true,
  altText: true,
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
    const query = input.query?.trim().toLowerCase();
    const perTypeLimit =
      input.scope === "ALL" ? Math.max(8, Math.ceil(input.limit / 3) + 4) : input.limit;

    const shouldLoadContent = ["ALL", "JOURNAL", "ARTICLE", "PROJECT"].includes(input.scope);
    const shouldLoadCourses = ["ALL", "COURSE"].includes(input.scope);
    const shouldLoadQuizzes = ["ALL", "QUIZ"].includes(input.scope);

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
            include: {
              coverImage: { select: quizCoverSelect },
              _count: { select: { questions: true, attempts: true } },
            },
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
              coverImage: quiz.coverImage,
              category: null,
              tags: [],
              meta: {
                questionCount: quiz._count.questions,
                attemptsCount: quiz._count.attempts,
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

    const items = sorted.slice(0, input.limit);
    const counts = {
      JOURNAL: items.filter((item) => item.type === "JOURNAL").length,
      ARTICLE: items.filter((item) => item.type === "ARTICLE").length,
      PROJECT: items.filter((item) => item.type === "PROJECT").length,
      COURSE: items.filter((item) => item.type === "COURSE").length,
      QUIZ: items.filter((item) => item.type === "QUIZ").length,
    };

    return {
      query: input.query ?? "",
      scope: input.scope,
      items,
      counts,
      total: items.length,
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

      const [items, facetSource] = await Promise.all([
        ctx.db.content.findMany({
          where,
          orderBy: orderBySort(input.sort),
          take: input.limit,
          include: contentListInclude,
        }),
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
          take: 500,
        }),
      ]);

      return {
        items,
        facets: {
          categories: getTopCategoryFacet(facetSource, 16),
          tags: getTopTagFacet(facetSource, 20),
        },
      };
    }),

  listCourses: publicProcedure
    .input(publicCourseDiscoveryInputSchema)
    .query(async ({ ctx, input }) => {
      try {
        const items = await ctx.db.course.findMany({
          where: {
            status: COURSE_STATUS.PUBLISHED,
            ...(input.featuredOnly ? { isFeatured: true } : {}),
            ...(input.difficulty ? { difficultyLevel: input.difficulty } : {}),
            ...(input.query
              ? {
                  OR: [
                    { title: { contains: input.query, mode: "insensitive" } },
                    { summary: { contains: input.query, mode: "insensitive" } },
                    { descriptionHtml: { contains: input.query, mode: "insensitive" } },
                  ],
                }
              : {}),
          },
          orderBy: orderBySort(input.sort),
          take: input.limit,
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
        });

        const difficultyCounts = items.reduce<Record<string, number>>((acc, item) => {
          const key = item.difficultyLevel ?? "UNSPECIFIED";
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {});

        return {
          items,
          facets: {
            difficultyCounts,
          },
        };
      } catch (error) {
        if (isMissingTableError(error, ["Course"])) {
          return {
            items: [],
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
      try {
        const items = await ctx.db.quiz.findMany({
          where: {
            status: QUIZ_STATUS.PUBLISHED,
            ...(input.featuredOnly ? { isFeatured: true } : {}),
            ...(input.query
              ? {
                  OR: [
                    { title: { contains: input.query, mode: "insensitive" } },
                    { description: { contains: input.query, mode: "insensitive" } },
                  ],
                }
              : {}),
          },
          orderBy: orderBySort(input.sort),
          take: input.limit,
          include: {
            coverImage: {
              select: quizCoverSelect,
            },
            _count: {
              select: {
                questions: true,
                attempts: true,
              },
            },
          },
        });

        return { items };
      } catch (error) {
        if (isMissingTableError(error, ["Quiz"])) {
          return { items: [] };
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

    const items = await ctx.db.content.findMany({
      where: {
        publishStatus: PUBLISH_STATUS.PUBLISHED,
        tags: {
          some: {
            tagId: tag.id,
          },
        },
      },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      take: input.limit,
      include: contentListInclude,
    });

    return {
      tag: {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        usageCount: tag._count.contentTags,
      },
      items,
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

      const items = await ctx.db.content.findMany({
        where: {
          publishStatus: PUBLISH_STATUS.PUBLISHED,
          categoryId: category.id,
        },
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        take: input.limit,
        include: contentListInclude,
      });

      return {
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          usageCount: category._count.contents,
        },
        items,
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
          include: {
            coverImage: { select: quizCoverSelect },
            _count: { select: { attempts: true, questions: true } },
          },
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
              coverImage: item.coverImage,
              category: null,
              tags: [],
              meta: {
                questionCount: item._count.questions,
                attemptsCount: item._count.attempts,
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

      const [featuredCoursesResult, recentCoursesResult, featuredQuizzesResult, recentQuizzesResult] =
        await Promise.allSettled([
          ctx.db.course.findMany({
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
          }),
          ctx.db.course.findMany({
            where: {
              status: COURSE_STATUS.PUBLISHED,
            },
            orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
            take: input.recentLimit,
            include: {
              coverImage: { select: courseCoverSelect },
              _count: { select: { lessons: true, sections: true } },
            },
          }),
          ctx.db.quiz.findMany({
            where: {
              status: QUIZ_STATUS.PUBLISHED,
              isFeatured: true,
            },
            orderBy: [{ publishedAt: "desc" }],
            take: input.featuredLimit,
            include: {
              coverImage: { select: quizCoverSelect },
              _count: { select: { attempts: true, questions: true } },
            },
          }),
          ctx.db.quiz.findMany({
            where: {
              status: QUIZ_STATUS.PUBLISHED,
            },
            orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
            take: input.recentLimit,
            include: {
              coverImage: { select: quizCoverSelect },
              _count: { select: { attempts: true, questions: true } },
            },
          }),
        ]);

      const featuredCourses =
        featuredCoursesResult.status === "fulfilled" ? featuredCoursesResult.value : [];
      const recentCourses =
        recentCoursesResult.status === "fulfilled" ? recentCoursesResult.value : [];
      const featuredQuizzes =
        featuredQuizzesResult.status === "fulfilled" ? featuredQuizzesResult.value : [];
      const recentQuizzes =
        recentQuizzesResult.status === "fulfilled" ? recentQuizzesResult.value : [];

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
            coverImage: quiz.coverImage,
            category: null,
            tags: [],
            meta: {
              questionCount: quiz._count.questions,
              attemptsCount: quiz._count.attempts,
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
        featuredQuizzes,
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

    return tag;
  }),

  updateTag: adminProcedure.input(adminUpdateTagInputSchema).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db.tag.findUnique({
      where: { id: input.id },
      select: { id: true },
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

      return category;
    }),

  updateCategory: adminProcedure
    .input(adminUpdateCategoryInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.category.findUnique({
        where: { id: input.id },
        select: { id: true },
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

      return { id: input.id };
    }),
});
