import { describe, expect, it } from "vitest";
import { formatIsoDate } from "@/lib/utils/date";
import { getSearchParam, getSearchParamBoolean } from "@/lib/discovery/query";

describe("date formatting utility", () => {
  it("formats dates as UTC ISO yyyy-mm-dd", () => {
    expect(formatIsoDate(new Date("2026-03-09T12:34:56.000Z"))).toBe("2026-03-09");
  });

  it("returns a stable fallback for invalid dates", () => {
    expect(formatIsoDate("not-a-date")).toBe("Invalid date");
  });
});

describe("content filter helpers", () => {
  it("resolves first search param value", () => {
    expect(getSearchParam(["first", "second"])).toBe("first");
  });

  it("parses boolean params", () => {
    expect(getSearchParamBoolean("true")).toBe(true);
    expect(getSearchParamBoolean("1")).toBe(true);
    expect(getSearchParamBoolean("false")).toBe(false);
  });
});
