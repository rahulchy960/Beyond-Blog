import "server-only";

import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";

const emptyStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim().length === 0 ? undefined : value;

const optionalString = () =>
  z.preprocess(emptyStringToUndefined, z.string().trim().min(1).optional());

const optionalEmail = () =>
  z.preprocess(emptyStringToUndefined, z.string().trim().email().optional());

const optionalBoolean = () =>
  z.preprocess((value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }
    return undefined;
  }, z.boolean().optional());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: optionalString(),
  VERCEL_URL: optionalString(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .trim()
    .regex(/^pk_(test|live)_/, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must be a valid Clerk key."),
  CLERK_SECRET_KEY: z
    .string()
    .trim()
    .regex(/^sk_(test|live)_/, "CLERK_SECRET_KEY must be a valid Clerk secret."),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().trim().default("/sign-in"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().trim().default("/sign-in"),
  CLERK_WEBHOOK_SECRET: optionalString(),
  DATABASE_URL: z
    .string()
    .trim()
    .startsWith("postgresql://", "DATABASE_URL must be a Neon/Postgres URL."),
  DIRECT_URL: z
    .string()
    .trim()
    .startsWith("postgresql://", "DIRECT_URL must be a Neon/Postgres URL."),
  SINGLE_ADMIN_CLERK_USER_ID: optionalString(),
  SINGLE_ADMIN_EMAIL: optionalEmail(),
  SINGLE_ADMIN_FIRST_NAME: optionalString(),
  SINGLE_ADMIN_LAST_NAME: optionalString(),
  ALLOW_ADMIN_REASSIGN: optionalBoolean().default(false),
  INTERACTION_TOKEN_SECRET: optionalString(),
  UPLOADTHING_TOKEN: optionalString(),
  NEXT_PUBLIC_IMAGE_HOSTS: optionalString(),
  NEXT_PUBLIC_SITE_NAME: optionalString(),
  NEXT_PUBLIC_SITE_DESCRIPTION: optionalString(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables:");
  for (const [key, messages] of Object.entries(parsedEnv.error.flatten().fieldErrors)) {
    console.error(`- ${key}: ${messages?.join(", ")}`);
  }
  throw new Error("Environment validation failed");
}

const envData = parsedEnv.data;
const appUrl = envData.NEXT_PUBLIC_APP_URL ?? (envData.VERCEL_URL ? `https://${envData.VERCEL_URL}` : undefined);

if (!appUrl) {
  if (isProduction) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL is required in production (or provide VERCEL_URL at runtime).",
    );
  }
}

const resolvedAppUrl = appUrl ?? "http://localhost:3000";
const parsedAppUrl = z.string().url().safeParse(resolvedAppUrl);
if (!parsedAppUrl.success) {
  throw new Error("NEXT_PUBLIC_APP_URL (or derived VERCEL_URL) is not a valid URL.");
}

const normalizedAppUrl = new URL(parsedAppUrl.data);
if (normalizedAppUrl.pathname !== "/" || normalizedAppUrl.search || normalizedAppUrl.hash) {
  throw new Error("NEXT_PUBLIC_APP_URL must be a bare origin (for example https://example.com).");
}

const isLocalHostUrl =
  normalizedAppUrl.hostname === "localhost" || normalizedAppUrl.hostname === "127.0.0.1";
const isStrictProduction = isProduction && !isLocalHostUrl;

if (isStrictProduction && normalizedAppUrl.protocol !== "https:") {
  throw new Error("NEXT_PUBLIC_APP_URL must use https:// in production.");
}

if (isStrictProduction && envData.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_test_")) {
  throw new Error("Use a Clerk production publishable key (pk_live_) in production.");
}

if (isStrictProduction && envData.CLERK_SECRET_KEY.startsWith("sk_test_")) {
  throw new Error("Use a Clerk production secret key (sk_live_) in production.");
}

if (isStrictProduction && !envData.UPLOADTHING_TOKEN) {
  throw new Error("UPLOADTHING_TOKEN is required in production.");
}

if (
  (envData.SINGLE_ADMIN_CLERK_USER_ID && !envData.SINGLE_ADMIN_EMAIL) ||
  (!envData.SINGLE_ADMIN_CLERK_USER_ID && envData.SINGLE_ADMIN_EMAIL)
) {
  throw new Error(
    "SINGLE_ADMIN_CLERK_USER_ID and SINGLE_ADMIN_EMAIL must be provided together.",
  );
}

if (
  isStrictProduction &&
  (!envData.SINGLE_ADMIN_CLERK_USER_ID || !envData.SINGLE_ADMIN_EMAIL)
) {
  throw new Error(
    "Single-admin environment configuration is required in production.",
  );
}

if (isStrictProduction && envData.NEXT_PUBLIC_CLERK_SIGN_IN_URL !== "/sign-in") {
  throw new Error("NEXT_PUBLIC_CLERK_SIGN_IN_URL must stay set to /sign-in for Beyond Blog.");
}

if (isStrictProduction && envData.NEXT_PUBLIC_CLERK_SIGN_UP_URL !== "/sign-in") {
  throw new Error("NEXT_PUBLIC_CLERK_SIGN_UP_URL must stay set to /sign-in (sign-up is disabled).");
}

export const env = {
  ...envData,
  NEXT_PUBLIC_APP_URL: normalizedAppUrl.origin,
};
