import { describe, expect, it } from "vitest";
import { CONTENT_TYPE, PUBLISH_STATUS } from "@/lib/content/enums";
import {
  contentWriteSchema,
  getSlugFromTitle,
  listAdminContentInputSchema,
  normalizeOptionalText,
  slugSchema,
} from "@/lib/content/schemas";

describe("content schemas", () => {
  it("accepts a valid content payload", () => {
    const payload = {
      title: "Production Article",
      slug: "production-article",
      summary: "short summary",
      bodyJson: { type: "doc", content: [] },
      type: CONTENT_TYPE.ARTICLE,
      coverImageAssetId: null,
      categoryId: null,
      tagNames: ["engineering", "testing"],
      isFeatured: false,
      seoTitle: "SEO title",
      seoDescription: "SEO description",
      publishStatus: PUBLISH_STATUS.PUBLISHED,
    };

    const parsed = contentWriteSchema.parse(payload);
    expect(parsed.slug).toBe("production-article");
    expect(parsed.type).toBe(CONTENT_TYPE.ARTICLE);
  });

  it("rejects invalid slugs", () => {
    expect(() => slugSchema.parse("Not Valid")).toThrow(
      "Use lowercase letters, numbers, and hyphens only.",
    );
  });

  it("normalizes optional text and title-derived slug", () => {
    expect(normalizeOptionalText(undefined)).toBeNull();
    expect(normalizeOptionalText("   ")).toBeNull();
    expect(normalizeOptionalText("  hello world  ")).toBe("hello world");
    expect(getSlugFromTitle("My Sample Title")).toBe("my-sample-title");
  });

  it("applies admin listing defaults", () => {
    const parsed = listAdminContentInputSchema.parse({});
    expect(parsed.featured).toBe("all");
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(20);
  });
});
