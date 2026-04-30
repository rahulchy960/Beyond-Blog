import { describe, expect, it } from "vitest";
import { defaultSeoSettings, mergeSeoSettings, toAbsoluteUrl } from "@/lib/seo/config";
import { buildArticleSchema, buildBreadcrumbSchema } from "@/lib/seo/structured-data";

describe("seo metadata builders", () => {
  it("merges dynamic settings from site payload", () => {
    const seo = mergeSeoSettings({
      siteTitle: "Beyond Blog",
      siteSubtitle: "Editorial platform",
      socialLinks: {
        seo: {
          titleTemplate: "%s | Beyond Blog Custom",
          siteUrl: "https://example.com",
          defaultOgImageUrl: "https://example.com/og.png",
          twitterHandle: "@beyond",
        },
      },
    });

    expect(seo.titleTemplate).toBe("%s | Beyond Blog Custom");
    expect(seo.siteUrl).toBe("https://example.com");
    expect(seo.twitterHandle).toBe("@beyond");
  });

  it("builds breadcrumb and article schema with absolute URLs", () => {
    const seo = { ...defaultSeoSettings, siteUrl: "https://beyondblog.dev" };
    const breadcrumb = buildBreadcrumbSchema(
      [
        { name: "Home", path: "/" },
        { name: "Articles", path: "/articles" },
      ],
      seo,
    );

    const article = buildArticleSchema({
      seo,
      title: "Production Testing",
      path: "/articles/production-testing",
      description: "How we test Beyond Blog.",
      publishedAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });

    expect(toAbsoluteUrl("/articles", seo.siteUrl)).toBe("https://beyondblog.dev/articles");
    expect((breadcrumb.itemListElement as Array<{ item: string }>)[1]?.item).toBe(
      "https://beyondblog.dev/articles",
    );
    expect(article.url).toBe("https://beyondblog.dev/articles/production-testing");
  });
});
