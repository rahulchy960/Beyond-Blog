import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import React from "react";
import { server } from "@/tests/mocks/server";

process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "pk_test_test";
process.env.CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? "sk_test_test";
process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in";
process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/sign-in";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/beyond_blog_test";
process.env.DIRECT_URL =
  process.env.DIRECT_URL ?? "postgresql://test:test@localhost:5432/beyond_blog_test";

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    return React.createElement("img", { alt: props.alt ?? "", ...props });
  },
}));

vi.mock("server-only", () => ({}));

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
