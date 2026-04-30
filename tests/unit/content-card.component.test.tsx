import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { CONTENT_TYPE } from "@/lib/content/enums";
import { ContentCard } from "@/components/content/content-card";
import { renderWithProviders } from "@/tests/utils";

describe("ContentCard", () => {
  it("renders title, metadata, and taxonomy links", () => {
    renderWithProviders(
      <ContentCard
        type={CONTENT_TYPE.ARTICLE}
        item={{
          id: "content_1",
          title: "Testing Beyond Blog",
          slug: "testing-beyond-blog",
          summary: "A practical testing guide.",
          publishedAt: "2026-02-01T00:00:00.000Z",
          category: { name: "Engineering", slug: "engineering" },
          tags: [{ tag: { name: "Testing", slug: "testing" } }],
        }}
      />,
    );

    expect(screen.getByText("Testing Beyond Blog")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Engineering" })).toHaveAttribute("href", "/categories/engineering");
    expect(screen.getByRole("link", { name: "Testing" })).toHaveAttribute("href", "/tags/testing");
  });
});
