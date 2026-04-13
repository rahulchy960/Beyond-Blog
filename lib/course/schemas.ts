import { z } from "zod";
import {
  COURSE_DIFFICULTY_LEVELS,
  COURSE_LESSON_ITEM_TYPES,
  COURSE_STATUSES,
} from "@/lib/content/enums";
import { contentBodySchema, slugSchema } from "@/lib/content/schemas";

export const courseWriteInputSchema = z.object({
  title: z.string().trim().min(3).max(220),
  slug: slugSchema,
  summary: z.string().trim().max(3000).optional().nullable(),
  descriptionJson: contentBodySchema.optional().nullable(),
  coverImageId: z.string().trim().min(1).optional().nullable(),
  difficultyLevel: z.enum(COURSE_DIFFICULTY_LEVELS).optional().nullable(),
  estimatedDurationMinutes: z.number().int().min(1).max(100000).optional().nullable(),
  isFeatured: z.boolean().default(false),
  seoTitle: z.string().trim().max(120).optional().nullable(),
  seoDescription: z.string().trim().max(300).optional().nullable(),
  status: z.enum(COURSE_STATUSES),
});

export const createCourseInputSchema = courseWriteInputSchema;

export const updateCourseInputSchema = courseWriteInputSchema.extend({
  id: z.string().trim().min(1),
});

export const deleteCourseInputSchema = z.object({
  id: z.string().trim().min(1),
});

export const courseByIdInputSchema = z.object({
  id: z.string().trim().min(1),
});

export const courseBySlugInputSchema = z.object({
  slug: slugSchema,
});

export const listAdminCoursesInputSchema = z.object({
  query: z.string().trim().max(160).optional(),
  status: z.enum(COURSE_STATUSES).optional(),
  featured: z.enum(["all", "featured", "not_featured"]).default("all"),
  page: z.number().int().min(1).max(500).default(1),
  pageSize: z.number().int().min(6).max(60).default(20),
});

export const listPublicCoursesInputSchema = z.object({
  query: z.string().trim().max(160).optional(),
  featuredOnly: z.boolean().optional(),
  limit: z.number().int().min(1).max(60).default(20),
});

export const updateCourseStatusInputSchema = z.object({
  id: z.string().trim().min(1),
});

export const toggleCourseFeaturedInputSchema = z.object({
  id: z.string().trim().min(1),
  value: z.boolean().optional(),
});

export const createCourseSectionInputSchema = z.object({
  courseId: z.string().trim().min(1),
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(2000).optional().nullable(),
});

export const updateCourseSectionInputSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(2000).optional().nullable(),
});

export const deleteCourseSectionInputSchema = z.object({
  id: z.string().trim().min(1),
});

export const reorderCourseSectionsInputSchema = z.object({
  courseId: z.string().trim().min(1),
  sectionIds: z.array(z.string().trim().min(1)).min(1),
});

export const lessonWriteSchema = z.object({
  courseId: z.string().trim().min(1),
  sectionId: z.string().trim().min(1).optional().nullable(),
  title: z.string().trim().min(2).max(220),
  slug: slugSchema.optional().nullable(),
  summary: z.string().trim().max(3000).optional().nullable(),
  itemType: z.enum(COURSE_LESSON_ITEM_TYPES),
  bodyJson: contentBodySchema.optional().nullable(),
  mediaAssetId: z.string().trim().min(1).optional().nullable(),
  externalUrl: z.string().trim().url().optional().nullable(),
  durationMinutes: z.number().int().min(1).max(100000).optional().nullable(),
  isPreview: z.boolean().default(false),
  isPublished: z.boolean().default(false),
});

export const createCourseLessonInputSchema = lessonWriteSchema;

export const updateCourseLessonInputSchema = lessonWriteSchema.extend({
  id: z.string().trim().min(1),
});

export const deleteCourseLessonInputSchema = z.object({
  id: z.string().trim().min(1),
});

export const reorderCourseLessonsInputSchema = z.object({
  courseId: z.string().trim().min(1),
  sectionId: z.string().trim().min(1).optional().nullable(),
  lessonIds: z.array(z.string().trim().min(1)).min(1),
});

export const attachLessonMediaInputSchema = z.object({
  lessonId: z.string().trim().min(1),
  mediaAssetId: z.string().trim().min(1),
});

export const detachLessonMediaInputSchema = z.object({
  lessonId: z.string().trim().min(1),
});

export function normalizeOptionalText(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

