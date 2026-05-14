# Environment Configuration

Beyond Blog validates runtime configuration in [`lib/env.ts`](./lib/env.ts) using Zod at startup.

## How It Works

- Server-only env access is centralized in `lib/env.ts`.
- Missing/invalid critical values fail fast during boot.
- Production checks enforce:
  - HTTPS app URL
  - live Clerk keys (`pk_live_`, `sk_live_`)
  - UploadThing token presence
  - single-admin env mapping presence

## Required Variables

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Yes (prod) | Public canonical site URL, e.g. `https://beyondblog.example.com`. |
| `DATABASE_URL` | Yes | Neon pooled connection string. |
| `DIRECT_URL` | Yes | Direct Neon connection for migrations/seed. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Must match environment (`pk_test_` in dev, `pk_live_` in prod). |
| `CLERK_SECRET_KEY` | Yes | Must match environment (`sk_test_` in dev, `sk_live_` in prod). |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | Keep set to `/sign-in`. |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | Keep set to `/sign-in` (sign-up disabled). |
| `SINGLE_ADMIN_CLERK_USER_ID` | Yes (prod) | Clerk user ID for the one owner admin. |
| `SINGLE_ADMIN_EMAIL` | Yes (prod) | Email for owner admin seed/upsert. |
| `UPLOADTHING_TOKEN` | Yes (prod) | UploadThing token for media upload and cleanup. |

## Optional Variables

| Variable | Notes |
| --- | --- |
| `VERCEL_URL` | Used as fallback to build app URL when `NEXT_PUBLIC_APP_URL` is missing. |
| `CLERK_WEBHOOK_SECRET` | Needed only if webhook handlers are enabled. |
| `SINGLE_ADMIN_FIRST_NAME` / `SINGLE_ADMIN_LAST_NAME` | Seed defaults for admin profile. |
| `ALLOW_ADMIN_REASSIGN` | Safety switch for intentional owner reassignment during seed (`true`/`false`). |
| `INTERACTION_TOKEN_SECRET` | Custom secret for anonymous interaction token hashing. |
| `NEXT_PUBLIC_IMAGE_HOSTS` | Comma-separated extra remote image hosts. |
| `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SITE_DESCRIPTION` | Optional display defaults. |

## Local Setup

```bash
cp .env.example .env
```

Fill values, then run:

```bash
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

## Safety Rules

- Do not import `lib/env.ts` into client components.
- Keep secrets server-side (`CLERK_SECRET_KEY`, `DATABASE_URL`, `UPLOADTHING_TOKEN`).
- Use `.env.local` or Vercel project env settings for real values.
