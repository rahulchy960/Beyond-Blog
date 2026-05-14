# Deployment Guide (Vercel + Neon + Clerk + UploadThing)

This guide is for Beyond Blog production deployment on Vercel.

## 1. Prerequisites

- Vercel project connected to this repository.
- Neon production database ready.
- Clerk production instance ready.
- UploadThing app + token ready.

## 2. Configure Environment Variables (Vercel)

Set these in Vercel project settings:

- `NEXT_PUBLIC_APP_URL` (your production domain, `https://...`)
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (`pk_live_...`)
- `CLERK_SECRET_KEY` (`sk_live_...`)
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-in`
- `SINGLE_ADMIN_CLERK_USER_ID`
- `SINGLE_ADMIN_EMAIL`
- `SINGLE_ADMIN_FIRST_NAME` (optional)
- `SINGLE_ADMIN_LAST_NAME` (optional)
- `ALLOW_ADMIN_REASSIGN=false`
- `UPLOADTHING_TOKEN`
- `INTERACTION_TOKEN_SECRET` (recommended)
- `CLERK_WEBHOOK_SECRET` (only if webhooks are enabled)
- `NEXT_PUBLIC_IMAGE_HOSTS` (optional)

Reference: [`ENVIRONMENT.md`](./ENVIRONMENT.md)

## 3. Database Migration Flow

### Local development

```bash
npm run db:migrate -- --name your_change_name
```

Commit generated migration files.

### Production deploy

Run on production DB:

```bash
npm run db:migrate:deploy
```

Optional status check:

```bash
npm run db:migrate:status
```

## 4. Seed Single Admin (One Time / Controlled)

Run seed against production DB only when needed:

```bash
npm run db:seed
```

Safety behavior:

- Existing owner admin cannot be reassigned unless `ALLOW_ADMIN_REASSIGN=true`.
- Keep `ALLOW_ADMIN_REASSIGN=false` after reassignment.

## 5. Clerk Production Settings

- Enable only sign-in paths used by app.
- Keep in-app sign-up disabled (`/sign-up` redirects to `/sign-in`).
- Add allowed redirect URLs:
  - `https://your-domain/sign-in`
  - `https://your-domain/admin`
  - `https://your-domain/unauthorized`

## 6. UploadThing Production Settings

- Confirm `UPLOADTHING_TOKEN` is valid in production env.
- Route handler is at `app/api/uploadthing/route.ts`.
- Upload auth is admin-only in `server/uploadthing/core.ts`.

## 7. Build and Smoke Tests

Before go-live:

```bash
npm run check
```

Then on deployed app validate:

- admin sign-in works
- `/admin` is protected
- media upload works
- publish workflow works
- public routes render and are indexable

Full checklist: [`LAUNCH_CHECKLIST.md`](./LAUNCH_CHECKLIST.md)

## 8. Rollback Strategy

- Redeploy last known-good Vercel deployment.
- If migration caused issue:
  - apply emergency forward-fix migration
  - avoid ad-hoc destructive manual SQL in production
- Keep hotfix branch with minimal diff for rapid redeploy.
