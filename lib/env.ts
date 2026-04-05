import { z } from "zod";

const notPlaceholder = (value: string) =>
  !["replace_me", "user:password", "ep-example"].some((needle) =>
    value.includes(needle),
  );
const shouldEnforceRealSecrets = process.env.NODE_ENV === "production";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .startsWith("pk_")
    .refine(
      (value) => !shouldEnforceRealSecrets || notPlaceholder(value),
      "Replace NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY with a real key",
    ),
  CLERK_SECRET_KEY: z
    .string()
    .startsWith("sk_")
    .refine(
      (value) => !shouldEnforceRealSecrets || notPlaceholder(value),
      "Replace CLERK_SECRET_KEY with a real key",
    ),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default("/sign-in"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default("/sign-up"),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  DATABASE_URL: z
    .string()
    .startsWith("postgresql://")
    .refine(
      (value) => !shouldEnforceRealSecrets || notPlaceholder(value),
      "Replace DATABASE_URL with your Neon URL",
    ),
  DIRECT_URL: z
    .string()
    .startsWith("postgresql://")
    .refine(
      (value) => !shouldEnforceRealSecrets || notPlaceholder(value),
      "Replace DIRECT_URL with your Neon URL",
    ),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    "Invalid environment variables:",
    parsedEnv.error.flatten().fieldErrors,
  );
  throw new Error("Environment validation failed");
}

export const env = parsedEnv.data;
