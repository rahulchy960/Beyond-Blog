import { z } from "zod";
import { COMMENT_STATUSES, INTERACTION_TARGET_TYPES } from "@/lib/content/enums";

const emptyToNull = (value: unknown) =>
  typeof value === "string" && value.trim().length === 0 ? null : value;

const guestNameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters.")
  .max(80, "Name must be 80 characters or less.");

const commentBodySchema = z
  .string()
  .trim()
  .min(3, "Comment must be at least 3 characters.")
  .max(5000, "Comment must be 5000 characters or less.")
  .refine((value) => /[A-Za-z0-9]/.test(value), "Comment must include readable text.");

const guestEmailSchema = z.preprocess(
  emptyToNull,
  z.string().trim().email("Enter a valid email address.").max(254).nullable().optional(),
);

const guestWebsiteSchema = z.preprocess(
  emptyToNull,
  z.string().trim().url("Enter a valid URL.").max(2048).nullable().optional(),
);

export const interactionTargetInputSchema = z.object({
  targetType: z.enum(INTERACTION_TARGET_TYPES),
  targetId: z.string().trim().min(1).max(191),
});

export const listVisibleCommentsInputSchema = interactionTargetInputSchema.extend({
  limit: z.number().int().min(1).max(200).default(80),
});

export const createCommentInputSchema = interactionTargetInputSchema.extend({
  guestName: guestNameSchema,
  guestEmail: guestEmailSchema,
  guestWebsite: guestWebsiteSchema,
  body: commentBodySchema,
  honeypot: z.string().max(200).optional().default(""),
});

export const toggleLikeInputSchema = interactionTargetInputSchema;
export const getLikeSummaryInputSchema = interactionTargetInputSchema;

export const adminListCommentsInputSchema = z.object({
  query: z.string().trim().max(180).optional(),
  status: z.enum(COMMENT_STATUSES).optional(),
  targetType: z.enum(INTERACTION_TARGET_TYPES).optional(),
  limit: z.number().int().min(1).max(200).default(80),
});

export const updateCommentStatusInputSchema = z.object({
  commentId: z.string().trim().min(1),
  status: z.enum(COMMENT_STATUSES),
  moderationNote: z.string().trim().max(1000).nullable().optional(),
});

export const deleteCommentInputSchema = z.object({
  commentId: z.string().trim().min(1),
});

export function normalizeOptionalText(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeCommentBody(value: string) {
  const normalizedNewlines = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const collapsed = normalizedNewlines.replace(/\n{3,}/g, "\n\n");
  return collapsed.trim();
}
