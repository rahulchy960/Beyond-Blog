import { z } from "zod";
import { CONTENT_TYPES, PUBLISH_STATUSES } from "@/lib/content/enums";
import { slugifyText } from "@/lib/content/slug";

export const slugSchema = z
  .string()
  .trim()
  .min(2, "Slug must be at least 2 characters.")
  .max(160, "Slug must be 160 characters or less.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only.");

export const contentBodySchema = z.object({
  type: z.string().min(1),
  content: z.array(z.any()).optional(),
}).passthrough();

export const contentWriteSchema = z.object({
  title: z.string().trim().min(3).max(200),
  slug: slugSchema,
  summary: z.string().trim().max(3000).optional().nullable(),
  bodyJson: contentBodySchema,
  type: z.enum(CONTENT_TYPES),
  coverImageAssetId: z.string().trim().min(1).optional().nullable(),
  categoryId: z.string().trim().min(1).optional().nullable(),
  tagNames: z.array(z.string().trim().min(1).max(64)).max(20),
  isFeatured: z.boolean(),
  seoTitle: z.string().trim().max(120).optional().nullable(),
  seoDescription: z.string().trim().max(300).optional().nullable(),
  publishStatus: z.enum(PUBLISH_STATUSES),
});

export const createContentInputSchema = contentWriteSchema;

export const updateContentInputSchema = contentWriteSchema.extend({
  id: z.string().trim().min(1),
});

export const listAdminContentInputSchema = z.object({
  type: z.enum(CONTENT_TYPES).optional(),
  query: z.string().trim().max(120).optional(),
  status: z.enum(PUBLISH_STATUSES).optional(),
  featured: z.enum(["all", "featured", "not_featured"]).default("all"),
  page: z.number().int().min(1).max(500).default(1),
  pageSize: z.number().int().min(6).max(60).default(20),
});

export const listPublicContentInputSchema = z.object({
  type: z.enum(CONTENT_TYPES),
  limit: z.number().int().min(1).max(60).default(20),
  query: z.string().trim().max(120).optional(),
});

export const getContentByIdInputSchema = z.object({
  id: z.string().trim().min(1),
});

export const getContentBySlugInputSchema = z.object({
  slug: slugSchema,
  type: z.enum(CONTENT_TYPES),
});

export const updateContentStatusInputSchema = z.object({
  id: z.string().trim().min(1),
});

export const toggleFeaturedInputSchema = z.object({
  id: z.string().trim().min(1),
  value: z.boolean().optional(),
});

export const deleteContentInputSchema = z.object({
  id: z.string().trim().min(1),
});

export const createTagInputSchema = z.object({
  name: z.string().trim().min(1).max(64),
});

export function normalizeOptionalText(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeTagName(name: string) {
  const trimmed = name.trim();
  return trimmed;
}

export function getSlugFromTitle(title: string) {
  return slugifyText(title);
}
