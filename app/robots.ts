import type { MetadataRoute } from "next";
import { toAbsoluteUrl } from "@/lib/seo/config";
import { getServerSeoSettings } from "@/lib/seo/server-settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getServerSeoSettings();
  const disallowPaths = ["/admin", "/api", "/sign-in", "/sign-up"];

  if (seo.noIndexSearchPage) {
    disallowPaths.push("/search");
  }

  return {
    rules: seo.allowIndexing
      ? {
          userAgent: "*",
          allow: "/",
          disallow: disallowPaths,
        }
      : {
          userAgent: "*",
          disallow: "/",
        },
    sitemap: toAbsoluteUrl("/sitemap.xml", seo.siteUrl),
    host: seo.siteUrl,
  };
}
