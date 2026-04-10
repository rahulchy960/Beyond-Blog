import { z } from "zod";
import { MEDIA_TYPES } from "@/lib/content/enums";

export const mediaProviderSchema = z.enum(["uploadthing", "mux", "external"]).default("uploadthing");

export const listMediaInputSchema = z.object({
  type: z.enum(MEDIA_TYPES).optional(),
  query: z.string().trim().max(120).optional(),
  limit: z.number().int().min(1).max(120).default(48),
  cursor: z.string().trim().min(1).optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
});

export const updateMediaMetadataInputSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().max(180).optional().nullable(),
  altText: z.string().trim().max(400).optional().nullable(),
  caption: z.string().trim().max(4000).optional().nullable(),
  thumbnailUrl: z.string().trim().url().optional().nullable(),
  externalUrl: z.string().trim().url().optional().nullable(),
  playbackUrl: z.string().trim().url().optional().nullable(),
});

export const deleteMediaInputSchema = z.object({
  id: z.string().trim().min(1),
});

export const attachMediaToContentInputSchema = z.object({
  mediaId: z.string().trim().min(1),
  contentId: z.string().trim().min(1),
});

export const detachMediaFromContentInputSchema = z.object({
  mediaId: z.string().trim().min(1),
});

export const createExternalVideoInputSchema = z.object({
  title: z.string().trim().max(180).optional().nullable(),
  externalUrl: z.string().trim().url(),
  playbackUrl: z.string().trim().url().optional().nullable(),
  thumbnailUrl: z.string().trim().url().optional().nullable(),
  provider: mediaProviderSchema.default("external"),
  providerAssetId: z.string().trim().max(200).optional().nullable(),
  mimeType: z.string().trim().default("video/*"),
  durationSeconds: z.number().int().nonnegative().optional().nullable(),
});

export const listMediaForPickerInputSchema = z.object({
  query: z.string().trim().max(120).optional(),
  limit: z.number().int().min(1).max(60).default(30),
  types: z.array(z.enum(MEDIA_TYPES)).min(1).optional(),
});

export function normalizeOptionalText(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

