import { describe, expect, it } from "vitest";
import { INTERACTION_TARGET_TYPE } from "@/lib/content/enums";
import { createCommentInputSchema, normalizeCommentBody } from "@/lib/interaction/schemas";

describe("comment validation", () => {
  it("accepts valid comment input", () => {
    const parsed = createCommentInputSchema.parse({
      targetType: INTERACTION_TARGET_TYPE.CONTENT,
      targetId: "content_1",
      guestName: "Rahul",
      guestEmail: "rahul@example.com",
      guestWebsite: "https://example.com",
      body: "Great article, thanks for sharing.",
      honeypot: "",
    });

    expect(parsed.targetId).toBe("content_1");
  });

  it("rejects comments without readable text", () => {
    expect(() =>
      createCommentInputSchema.parse({
        targetType: INTERACTION_TARGET_TYPE.CONTENT,
        targetId: "content_1",
        guestName: "Rahul",
        guestEmail: "",
        guestWebsite: "",
        body: "!!! ???",
        honeypot: "",
      }),
    ).toThrow("Comment must include readable text.");
  });

  it("normalizes repeated newlines", () => {
    const value = normalizeCommentBody("line1\r\n\r\n\r\nline2");
    expect(value).toBe("line1\n\nline2");
  });
});
