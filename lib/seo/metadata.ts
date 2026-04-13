import { cache } from "react";
import type { Metadata } from "next";
import { getPublicServerCaller } from "@/server/api/caller";
import { defaultSeoSettings, mergeSeoSettings, toAbsoluteUrl, type SeoSettingsState } from "@/lib/seo/config";

type BuildMetadataInput = {
  title?: string | null;
  description?: string | null;
  path: string;
  canonicalPath?: string | null;
  imageUrl?: string | null;
  ogType?: "website" | "article";
  noIndex?: boolean;
  keywords?: string[];
};

function toMetadataImageUrl(value: string | null | undefined, siteUrl: string) {
  if (!value) {
    return null;
  }

  return toAbsoluteUrl(value, siteUrl);
}

const getSeoSettingsCached = cache(async (): Promise<SeoSettingsState> => {
  try {
    const caller = await getPublicServerCaller();
    const site = await caller.profile.getPublicSeoSettings();
    if (!site) {
      return defaultSeoSettings;
    }

    return mergeSeoSettings({
      siteTitle: site.siteTitle,
      siteSubtitle: site.siteSubtitle,
      socialLinks: site.socialLinks,
    });
  } catch {
    return defaultSeoSettings;
  }
});

export async function getSeoSettings() {
  return getSeoSettingsCached();
}

export async function buildBaseMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();
  const baseUrl = new URL(seo.siteUrl);
  const ogImageUrl = toMetadataImageUrl(seo.defaultOgImageUrl, seo.siteUrl);
  const ogImage = ogImageUrl ? [ogImageUrl] : undefined;

  return {
    metadataBase: baseUrl,
    title: {
      default: seo.siteTitle,
      template: seo.titleTemplate,
    },
    description: seo.defaultDescription,
    alternates: {
      canonical: toAbsoluteUrl("/", seo.siteUrl),
    },
    openGraph: {
      type: "website",
      siteName: seo.siteTitle,
      title: seo.siteTitle,
      description: seo.defaultDescription,
      url: toAbsoluteUrl("/", seo.siteUrl),
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title: seo.siteTitle,
      description: seo.defaultDescription,
      images: ogImage,
      ...(seo.twitterHandle ? { creator: seo.twitterHandle } : {}),
    },
    robots: seo.allowIndexing
      ? undefined
      : {
          index: false,
          follow: false,
          nocache: true,
        },
  };
}

function resolveTitle(title: string | null | undefined, seo: SeoSettingsState) {
  if (!title || title.trim().length === 0) {
    return seo.siteTitle;
  }

  return title.trim();
}

function resolveDescription(description: string | null | undefined, seo: SeoSettingsState) {
  if (!description || description.trim().length === 0) {
    return seo.defaultDescription;
  }

  return description.trim();
}

export async function buildPageMetadata(input: BuildMetadataInput): Promise<Metadata> {
  const seo = await getSeoSettings();
  const title = resolveTitle(input.title, seo);
  const description = resolveDescription(input.description, seo);
  const pageUrl = toAbsoluteUrl(input.path, seo.siteUrl);
  const canonicalUrl = input.canonicalPath
    ? toAbsoluteUrl(input.canonicalPath, seo.siteUrl)
    : pageUrl;

  const image = toMetadataImageUrl(input.imageUrl ?? seo.defaultOgImageUrl, seo.siteUrl);
  const images = image ? [image] : undefined;
  const noIndex = input.noIndex || !seo.allowIndexing;

  return {
    title,
    description,
    keywords: input.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: input.ogType ?? "website",
      siteName: seo.siteTitle,
      title,
      description,
      url: pageUrl,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
      ...(seo.twitterHandle ? { creator: seo.twitterHandle } : {}),
    },
    robots: noIndex
      ? {
          index: false,
          follow: true,
          nocache: true,
        }
      : undefined,
  };
}

