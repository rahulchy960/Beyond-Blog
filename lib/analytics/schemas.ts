import { z } from "zod";

const optionalQueryText = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  },
  z.string().trim().max(180).optional(),
);

const optionalToken = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  },
  z.string().trim().max(80).optional(),
);

export const analyticsTimeRangeSchema = z.enum(["7d", "30d", "90d", "all"]);

export const analyticsDetailInputSchema = z.object({
  timeRange: analyticsTimeRangeSchema.default("30d"),
});

export const topPerformingInputSchema = z.object({
  metric: z.enum(["LIKES", "COMMENTS", "ENGAGEMENT", "QUIZ_ATTEMPTS"]).default("ENGAGEMENT"),
  timeRange: analyticsTimeRangeSchema.default("30d"),
  limit: z.number().int().min(1).max(25).default(8),
});

export const recentActivityInputSchema = z.object({
  limit: z.number().int().min(1).max(60).default(18),
});

export const listAuditLogsInputSchema = z.object({
  query: optionalQueryText,
  action: optionalToken,
  entityType: optionalToken,
  timeRange: analyticsTimeRangeSchema.default("30d"),
  cursor: z.string().trim().min(1).optional(),
  limit: z.number().int().min(10).max(100).default(30),
});

