import { toAbsoluteUrl, type SeoSettingsState } from "@/lib/seo/config";

export type JsonLd = Record<string, unknown>;

type IdentityInput = {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  email?: string | null;
  websiteUrl?: string | null;
};

export function buildWebSiteSchema(seo: SeoSettingsState): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: seo.siteTitle,
    url: seo.siteUrl,
    description: seo.defaultDescription,
    inLanguage: "en",
  };
}

export function buildPersonSchema(seo: SeoSettingsState, identity: IdentityInput): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: identity.name,
    description: identity.description ?? seo.defaultDescription,
    url: identity.websiteUrl ?? seo.siteUrl,
    image: identity.imageUrl ?? undefined,
    email: identity.email ? `mailto:${identity.email}` : undefined,
  };
}

export function buildBreadcrumbSchema(items: Array<{ name: string; path: string }>, seo: SeoSettingsState): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path, seo.siteUrl),
    })),
  };
}

export function buildArticleSchema(args: {
  seo: SeoSettingsState;
  title: string;
  description?: string | null;
  path: string;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  imageUrl?: string | null;
  authorName?: string | null;
  kind?: "Article" | "BlogPosting";
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": args.kind ?? "Article",
    headline: args.title,
    description: args.description ?? args.seo.defaultDescription,
    url: toAbsoluteUrl(args.path, args.seo.siteUrl),
    datePublished: args.publishedAt ? new Date(args.publishedAt).toISOString() : undefined,
    dateModified: args.updatedAt ? new Date(args.updatedAt).toISOString() : undefined,
    image: args.imageUrl ?? undefined,
    author: args.authorName
      ? {
          "@type": "Person",
          name: args.authorName,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: args.seo.siteTitle,
      logo: args.seo.defaultOgImageUrl ?? undefined,
    },
    mainEntityOfPage: toAbsoluteUrl(args.path, args.seo.siteUrl),
  };
}

export function buildCourseSchema(args: {
  seo: SeoSettingsState;
  title: string;
  description?: string | null;
  path: string;
  imageUrl?: string | null;
  providerName?: string | null;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: args.title,
    description: args.description ?? args.seo.defaultDescription,
    url: toAbsoluteUrl(args.path, args.seo.siteUrl),
    image: args.imageUrl ?? undefined,
    provider: {
      "@type": "Organization",
      name: args.providerName ?? args.seo.siteTitle,
      sameAs: args.seo.siteUrl,
    },
  };
}

export function buildQuizSchema(args: {
  seo: SeoSettingsState;
  title: string;
  description?: string | null;
  path: string;
  imageUrl?: string | null;
  questionCount?: number;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: args.title,
    description: args.description ?? args.seo.defaultDescription,
    url: toAbsoluteUrl(args.path, args.seo.siteUrl),
    image: args.imageUrl ?? undefined,
    educationalUse: "assessment",
    numberOfQuestions: args.questionCount,
  };
}

