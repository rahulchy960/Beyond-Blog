import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPrismaMock } from "@/tests/mocks/prisma";
import { userFactory } from "@/tests/factories";

const mocked = vi.hoisted(() => {
  return {
    auth: vi.fn(),
    findAdminByClerkUserId: vi.fn(),
    redirect: vi.fn((destination: string) => {
      throw new Error(`REDIRECT:${destination}`);
    }),
  };
});

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocked.auth,
  currentUser: vi.fn(async () => null),
}));

vi.mock("@/lib/auth/admin-repository", () => ({
  findAdminByClerkUserId: mocked.findAdminByClerkUserId,
}));

vi.mock("next/navigation", () => ({
  redirect: mocked.redirect,
}));

import { createTRPCContext } from "@/server/api/trpc";
import { contentRouter } from "@/server/api/routers/content";
import SignUpPage from "@/app/(auth)/sign-up/[[...sign-up]]/page";

const toDb = (db: ReturnType<typeof createPrismaMock>) =>
  db as unknown as Awaited<ReturnType<typeof createTRPCContext>>["db"];

describe("authentication and single-admin enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.auth.mockResolvedValue({ userId: "user_owner", sessionId: "sess_1" });
    mocked.findAdminByClerkUserId.mockResolvedValue(
      userFactory({ clerkUserId: "user_owner", role: "OWNER", isActive: true }),
    );
  });

  it("builds TRPC context from mocked Clerk session", async () => {
    const ctx = await createTRPCContext();
    expect(ctx.userId).toBe("user_owner");
    expect(ctx.isAuthenticated).toBe(true);
  });

  it("allows valid admin to access protected procedures", async () => {
    const db = createPrismaMock();
    db.category.findMany.mockResolvedValue([{ id: "cat_1", name: "Engineering", slug: "engineering" }]);

    const caller = contentRouter.createCaller({
      db: toDb(db),
      userId: "user_owner",
      sessionId: "sess_1",
      isAuthenticated: true,
    });

    const result = await caller.listCategories();
    expect(result).toHaveLength(1);
  });

  it("rejects non-admin users", async () => {
    const db = createPrismaMock();
    mocked.findAdminByClerkUserId.mockResolvedValue(null);

    const caller = contentRouter.createCaller({
      db: toDb(db),
      userId: "user_other",
      sessionId: "sess_2",
      isAuthenticated: true,
    });

    await expect(caller.listCategories()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("rejects unauthenticated users", async () => {
    const db = createPrismaMock();
    const caller = contentRouter.createCaller({
      db: toDb(db),
      userId: null,
      sessionId: null,
      isAuthenticated: false,
    });

    await expect(caller.listCategories()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("keeps sign-up route inaccessible", () => {
    expect(() => SignUpPage()).toThrow("REDIRECT:/sign-in");
    expect(mocked.redirect).toHaveBeenCalledWith("/sign-in");
  });
});
