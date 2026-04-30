import { describe, expect, it } from "vitest";
import { slugifyText } from "@/lib/content/slug";

describe("slugifyText", () => {
  it("normalizes accents and punctuation", () => {
    expect(slugifyText("Cr\u00E8me Br\u00FBl\u00E9e: 101!")).toBe("creme-brulee-101");
  });

  it("collapses mixed separators", () => {
    expect(slugifyText("alpha___beta   gamma")).toBe("alphabeta-gamma");
  });
});
