import { z } from "zod";
import {
  CONTENT_TYPES,
  COURSE_DIFFICULTY_LEVELS,
} from "@/lib/content/enums";
import { slugSchema } from "@/lib/content/schemas";

const optionalSearchText = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  },
  z.string().trim().max(160).optional(),
);

const optionalText = (max: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    },
    z.string().trim().max(max).nullable().optional(),
  );

const optionalSlug = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  },
  slugSchema.optional(),
);

export const discoveryScopeSchema = z.enum([
  "ALL",
  "JOURNAL",
  "ARTICLE",
  "PROJECT",
  "COURSE",
  "QUIZ",
]);

export const relatedTargetTypeSchema = z.enum(["CONTENT", "COURSE", "QUIZ"]);

export const publicSearchInputSchema = z.object({
  query: optionalSearchText,
  scope: discoveryScopeSchema.default("ALL"),
  category: optionalSlug,
  tag: optionalSlug,
  featuredOnly: z.boolean().optional(),
  difficulty: z.enum(COURSE_DIFFICULTY_LEVELS).optional(),
  sort: z.enum(["relevance", "newest"]).default("relevance"),
  limit: z.number().int().min(1).max(80).default(30),
});

export const publicContentDiscoveryInputSchema = z.object({
  type: z.enum(CONTENT_TYPES),
  query: optionalSearchText,
  category: optionalSlug,
  tag: optionalSlug,
  featuredOnly: z.boolean().optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  limit: z.number().int().min(1).max(80).default(36),
});

export const publicCourseDiscoveryInputSchema = z.object({
  query: optionalSearchText,
  difficulty: z.enum(COURSE_DIFFICULTY_LEVELS).optional(),
  featuredOnly: z.boolean().optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  limit: z.number().int().min(1).max(80).default(36),
});

export const publicQuizDiscoveryInputSchema = z.object({
  query: optionalSearchText,
  featuredOnly: z.boolean().optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  limit: z.number().int().min(1).max(80).default(36),
});

export const taxonomyBySlugInputSchema = z.object({
  slug: slugSchema,
  limit: z.number().int().min(1).max(80).default(40),
});

export const relatedContentInputSchema = z.object({
  targetType: relatedTargetTypeSchema,
  slug: slugSchema,
  limit: z.number().int().min(1).max(12).default(6),
});

export const homepageDiscoveryInputSchema = z.object({
  featuredLimit: z.number().int().min(1).max(12).default(4),
  recentLimit: z.number().int().min(1).max(24).default(10),
});

export const adminTaxonomyListInputSchema = z.object({
  query: optionalSearchText,
  limit: z.number().int().min(1).max(200).default(120),
});

export const adminCategoryWriteInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: optionalSlug,
  description: optionalText(2000),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(-1000).max(1000).default(0),
});

export const adminCreateCategoryInputSchema = adminCategoryWriteInputSchema;

export const adminUpdateCategoryInputSchema = adminCategoryWriteInputSchema.extend({
  id: z.string().trim().min(1),
});

export const adminDeleteCategoryInputSchema = z.object({
  id: z.string().trim().min(1),
});

export const adminTagWriteInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: optionalSlug,
});

export const adminCreateTagInputSchema = adminTagWriteInputSchema;

export const adminUpdateTagInputSchema = adminTagWriteInputSchema.extend({
  id: z.string().trim().min(1),
});

export const adminDeleteTagInputSchema = z.object({
  id: z.string().trim().min(1),
});

export function normalizeOptionalText(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

