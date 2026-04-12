import { z } from "zod";

const optionalTrimmedText = (max: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    },
    z.string().trim().max(max).nullable().optional(),
  );

const optionalUrlField = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  },
  z.string().trim().url().max(2000).nullable().optional(),
);

export const adminSeoSettingsInputSchema = z.object({
  siteTitle: z.string().trim().min(2).max(120),
  titleTemplate: z.string().trim().max(140).optional().nullable(),
  defaultDescription: optionalTrimmedText(320),
  siteUrl: optionalUrlField,
  defaultOgImageUrl: optionalUrlField,
  noIndexSearchPage: z.boolean().default(true),
  allowIndexing: z.boolean().default(true),
  twitterHandle: optionalTrimmedText(40),
});

export type AdminSeoSettingsInput = z.infer<typeof adminSeoSettingsInputSchema>;

