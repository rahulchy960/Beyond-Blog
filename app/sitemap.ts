import type { MetadataRoute } from "next";
import { Prisma } from "@prisma/client";
import { COURSE_STATUS, PUBLISH_STATUS, QUIZ_STATUS } from "@/lib/content/enums";
import { toAbsoluteUrl } from "@/lib/seo/config";
import { getServerSeoSettings } from "@/lib/seo/server-settings";
import { db } from "@/server/db";

function isMissingTableError(error: unknown, tableName: string) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code === "P2021") {
    return true;
  }

  if (error.code === "P2010") {
    return String(error.message).includes(tableName);
  }

  return false;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = await getServerSeoSettings();
  const items: MetadataRoute.Sitemap = [];

  const pushEntry = (path: string, lastModified?: Date | string | null) => {
    items.push({
      url: toAbsoluteUrl(path, seo.siteUrl),
      lastModified: lastModified ?? undefined,
      changeFrequency: "weekly",
      priority: path === "/" ? 1 : 0.7,
    });
  };

  pushEntry("/");
  pushEntry("/journals");
  pushEntry("/articles");
  pushEntry("/projects");
  pushEntry("/courses");
  pushEntry("/quizzes");

  if (!seo.noIndexSearchPage) {
    pushEntry("/search");
  }

  try {
    const contents = await db.content.findMany({
      where: {
        publishStatus: PUBLISH_STATUS.PUBLISHED,
      },
      select: {
        slug: true,
        type: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 4000,
    });

    for (const content of contents) {
      const basePath =
        content.type === "JOURNAL"
          ? "/journals"
          : content.type === "ARTICLE"
            ? "/articles"
            : "/projects";
      pushEntry(`${basePath}/${content.slug}`, content.updatedAt);
    }
  } catch (error) {
    if (!isMissingTableError(error, "Content")) {
      throw error;
    }
  }

  try {
    const courses = await db.course.findMany({
      where: {
        status: COURSE_STATUS.PUBLISHED,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 2000,
    });

    for (const course of courses) {
      pushEntry(`/courses/${course.slug}`, course.updatedAt);
    }
  } catch (error) {
    if (!isMissingTableError(error, "Course")) {
      throw error;
    }
  }

  try {
    const quizzes = await db.quiz.findMany({
      where: {
        status: QUIZ_STATUS.PUBLISHED,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 2000,
    });

    for (const quiz of quizzes) {
      pushEntry(`/quizzes/${quiz.slug}`, quiz.updatedAt);
    }
  } catch (error) {
    if (!isMissingTableError(error, "Quiz")) {
      throw error;
    }
  }

  try {
    const tags = await db.tag.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 2000,
    });

    for (const tag of tags) {
      pushEntry(`/tags/${tag.slug}`, tag.updatedAt);
    }
  } catch (error) {
    if (!isMissingTableError(error, "Tag")) {
      throw error;
    }
  }

  try {
    const categories = await db.category.findMany({
      where: {
        isActive: true,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 2000,
    });

    for (const category of categories) {
      pushEntry(`/categories/${category.slug}`, category.updatedAt);
    }
  } catch (error) {
    if (!isMissingTableError(error, "Category")) {
      throw error;
    }
  }

  return items;
}
