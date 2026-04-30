import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { CONTENT_TYPE } from "@/lib/content/enums";
import { renderWithProviders } from "@/tests/utils";

vi.mock("@/components/interaction/comment-thread", () => ({
  CommentThread: () => <div data-testid="comment-thread">comment-thread</div>,
}));

vi.mock("@/components/discovery/related-content-section", () => ({
  RelatedContentSection: () => <div data-testid="related-content">related-content</div>,
}));

vi.mock("@/components/content/rich-text-renderer", () => ({
  RichTextRenderer: ({ html }: { html: string }) => <div data-testid="rich-text">{html}</div>,
}));

import { PublicContentArticle } from "@/components/content/public-content-article";

describe("PublicContentArticle", () => {
  it("renders body, metadata, and discussion section", () => {
    renderWithProviders(
      <PublicContentArticle
        type={CONTENT_TYPE.ARTICLE}
        content={{
          id: "content_1",
          title: "Production Content",
          summary: "Summary text",
          bodyHtml: "<p>Body</p>",
          publishedAt: new Date("2026-02-01T00:00:00.000Z"),
          category: { name: "Engineering", slug: "engineering" },
          tags: [{ tag: { name: "Testing", slug: "testing" } }],
          coverImage: null,
        }}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Production Content" })).toBeInTheDocument();
    expect(screen.getByTestId("rich-text")).toHaveTextContent("<p>Body</p>");
    expect(screen.getByTestId("comment-thread")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Engineering" })).toHaveAttribute("href", "/categories/engineering");
  });
});
