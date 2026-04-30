import { describe, expect, it, vi } from "vitest";
import { makeNonSerializableCaller, type AppRouterCaller } from "@/server/api/caller";

describe("tRPC server caller wrapper", () => {
  it("does not treat JSON serialization as a toJSON procedure call", () => {
    const caller = new Proxy(vi.fn(), {
      get(_target, property) {
        if (property === "toJSON") {
          return vi.fn(() => {
            throw new Error("No procedure found on path \"toJSON\"");
          });
        }

        return undefined;
      },
    }) as unknown as AppRouterCaller;

    const safeCaller = makeNonSerializableCaller(caller);

    expect(JSON.stringify({ caller: safeCaller })).toBe("{}");
  });
});
