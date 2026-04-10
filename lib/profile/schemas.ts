import { z } from "zod";

const optionalUrlField = z
  .string()
  .trim()
  .url()
  .max(2000)
  .optional()
  .nullable();

export const adminProfileSettingsInputSchema = z.object({
  fullName: z.string().trim().max(140).optional().nullable(),
  designation: z.string().trim().max(180).optional().nullable(),
  bio: z.string().trim().max(5000).optional().nullable(),
  address: z.string().trim().max(1000).optional().nullable(),
  email: z.string().trim().email().max(320).optional().nullable(),
  phone: z.string().trim().max(64).optional().nullable(),
  jobs: z.string().trim().max(5000).optional().nullable(),
  education: z.string().trim().max(5000).optional().nullable(),
  profileImageId: z.string().trim().min(1).optional().nullable(),
  linkedinUrl: optionalUrlField,
  githubUrl: optionalUrlField,
  twitterUrl: optionalUrlField,
  websiteUrl: optionalUrlField,
  copyrightText: z.string().trim().max(220).optional().nullable(),
});

export function normalizeOptionalText(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

