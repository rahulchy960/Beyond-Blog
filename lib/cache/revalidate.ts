import "server-only";

import { revalidatePath } from "next/cache";
import { CONTENT_TYPE } from "@/lib/content/enums";

const PUBLIC_INDEX_PATHS = [
  "/",
  "/search",
  "/journals",
  "/articles",
  "/projects",
  "/courses",
  "/quizzes",
] as const;

type ContentTypeValue = (typeof CONTENT_TYPE)[keyof typeof CONTENT_TYPE];

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore revalidation issues to avoid blocking admin mutations.
  }
}

export function revalidatePublicIndexes() {
  for (const path of PUBLIC_INDEX_PATHS) {
    safeRevalidate(path);
  }
}

export function revalidateTaxonomyPaths(args: {
  categorySlug?: string | null;
  tagSlugs?: string[];
}) {
  if (args.categorySlug) {
    safeRevalidate(`/categories/${args.categorySlug}`);
  }

  for (const tagSlug of args.tagSlugs ?? []) {
    safeRevalidate(`/tags/${tagSlug}`);
  }
}

export function revalidateContentPaths(args: {
  type: ContentTypeValue;
  slug: string;
  previousSlug?: string | null;
  categorySlug?: string | null;
  tagSlugs?: string[];
}) {
  const basePath =
    args.type === CONTENT_TYPE.JOURNAL
      ? "/journals"
      : args.type === CONTENT_TYPE.ARTICLE
        ? "/articles"
        : "/projects";

  safeRevalidate(basePath);
  safeRevalidate(`${basePath}/${args.slug}`);
  if (args.previousSlug && args.previousSlug !== args.slug) {
    safeRevalidate(`${basePath}/${args.previousSlug}`);
  }
  revalidatePublicIndexes();
  revalidateTaxonomyPaths({
    categorySlug: args.categorySlug,
    tagSlugs: args.tagSlugs,
  });
}

export function revalidateCoursePaths(args: { slug: string; previousSlug?: string | null }) {
  safeRevalidate("/courses");
  safeRevalidate(`/courses/${args.slug}`);
  if (args.previousSlug && args.previousSlug !== args.slug) {
    safeRevalidate(`/courses/${args.previousSlug}`);
  }
  revalidatePublicIndexes();
}

export function revalidateQuizPaths(args: { slug: string; previousSlug?: string | null }) {
  safeRevalidate("/quizzes");
  safeRevalidate(`/quizzes/${args.slug}`);
  if (args.previousSlug && args.previousSlug !== args.slug) {
    safeRevalidate(`/quizzes/${args.previousSlug}`);
  }
  revalidatePublicIndexes();
}

export function revalidateProfileAndSeoPaths() {
  revalidatePublicIndexes();
}

