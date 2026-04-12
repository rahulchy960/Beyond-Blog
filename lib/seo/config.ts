import { env } from "@/lib/env";

export type SeoSettingsState = {
  siteTitle: string;
  titleTemplate: string;
  defaultDescription: string;
  siteUrl: string;
  defaultOgImageUrl: string | null;
  noIndexSearchPage: boolean;
  allowIndexing: boolean;
  twitterHandle: string | null;
};

export const defaultSeoSettings: SeoSettingsState = {
  siteTitle: "Beyond Blog",
  titleTemplate: "%s | Beyond Blog",
  defaultDescription:
    "Beyond Blog is a modern editorial platform for journals, articles, projects, courses, and public quizzes.",
  siteUrl: env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  defaultOgImageUrl: null,
  noIndexSearchPage: true,
  allowIndexing: true,
  twitterHandle: null,
};

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
}

function asTrimmedString(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function asOptionalTrimmedString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") {
    return value;
  }

  return fallback;
}

export function extractSeoPayloadFromSiteSetting(
  socialLinks: unknown,
): Partial<SeoSettingsState> {
  const root = asRecord(socialLinks);
  if (!root) {
    return {};
  }

  const seo = asRecord(root.seo);
  if (!seo) {
    return {};
  }

  return {
    titleTemplate: asTrimmedString(seo.titleTemplate, defaultSeoSettings.titleTemplate),
    defaultDescription: asTrimmedString(seo.defaultDescription, defaultSeoSettings.defaultDescription),
    siteUrl: asTrimmedString(seo.siteUrl, defaultSeoSettings.siteUrl),
    defaultOgImageUrl: asOptionalTrimmedString(seo.defaultOgImageUrl),
    noIndexSearchPage: asBoolean(seo.noIndexSearchPage, defaultSeoSettings.noIndexSearchPage),
    allowIndexing: asBoolean(seo.allowIndexing, defaultSeoSettings.allowIndexing),
    twitterHandle: asOptionalTrimmedString(seo.twitterHandle),
  };
}

export function mergeSeoSettings(args: {
  siteTitle?: string | null;
  siteSubtitle?: string | null;
  socialLinks?: unknown;
}) {
  const extracted = extractSeoPayloadFromSiteSetting(args.socialLinks);
  const siteTitle = asTrimmedString(args.siteTitle, defaultSeoSettings.siteTitle);
  const defaultDescription = asTrimmedString(
    extracted.defaultDescription ?? args.siteSubtitle,
    defaultSeoSettings.defaultDescription,
  );

  return {
    siteTitle,
    titleTemplate: asTrimmedString(extracted.titleTemplate, `%s | ${siteTitle}`),
    defaultDescription,
    siteUrl: asTrimmedString(extracted.siteUrl, defaultSeoSettings.siteUrl),
    defaultOgImageUrl: extracted.defaultOgImageUrl ?? null,
    noIndexSearchPage: extracted.noIndexSearchPage ?? defaultSeoSettings.noIndexSearchPage,
    allowIndexing: extracted.allowIndexing ?? defaultSeoSettings.allowIndexing,
    twitterHandle: extracted.twitterHandle ?? null,
  } satisfies SeoSettingsState;
}

export function withNormalizedPath(path: string) {
  if (!path.startsWith("/")) {
    return `/${path}`;
  }

  return path;
}

function isAbsoluteUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function toAbsoluteUrl(path: string, siteUrl: string) {
  if (isAbsoluteUrl(path)) {
    return path;
  }

  return new URL(withNormalizedPath(path), siteUrl).toString();
}
