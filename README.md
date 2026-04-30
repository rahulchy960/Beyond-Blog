# Beyond Blog

Production-ready Next.js App Router foundation for a academic publishing platform.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Clerk (single admin auth only)
- tRPC v11 + TanStack React Query v5
- Prisma v7 + Neon PostgreSQL
- Zod
- UploadThing (media uploads)

## Quick Start

```bash
npm install
cp .env.example .env
```

Fill `.env`, then run:

```bash
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

If you updated schema fields, also run:

```bash
npm run db:migrate -- --name add_guest_interactions
```

## Operational Docs

- [Environment variables](./ENVIRONMENT.md)
- [Deployment guide](./DEPLOYMENT.md)
- [Security notes](./SECURITY.md)
- [Launch checklist](./LAUNCH_CHECKLIST.md)

## Single Admin Setup

Beyond Blog supports exactly one admin (`AdminUser.role = OWNER`, unique).

Set in `.env`:

- `SINGLE_ADMIN_CLERK_USER_ID`
- `SINGLE_ADMIN_EMAIL`
- optional `SINGLE_ADMIN_FIRST_NAME`
- optional `SINGLE_ADMIN_LAST_NAME`

Run:

```bash
npm run db:seed
```

To intentionally transfer ownership, set `ALLOW_ADMIN_REASSIGN=true` for the seed run.

## Admin Authorization Flow

1. `proxy.ts` protects `/admin` paths at the edge and redirects unauthenticated visitors to Clerk sign-in.
2. `lib/auth/admin.ts` enforces server-side checks:
- `getCurrentAdmin()`
- `isAdminUser()`
- `requireAdmin()`
3. `app/(admin)/admin/layout.tsx` calls `requireAdmin()` on every admin request.
4. Signed-in users not mapped to the single `AdminUser` owner are redirected to `/unauthorized`.
5. `server/api/trpc.ts` exposes:
- `publicProcedure` for open operations
- `adminProcedure` for owner-only operations (`UNAUTHORIZED`/`FORBIDDEN` errors)

## Content Management (V1)

- Admin CRUD is implemented via `server/api/routers/content.ts`.
- Supported types:
  - `JOURNAL`
  - `ARTICLE`
  - `PROJECT`
- Admin routes:
  - `/admin/content`
  - `/admin/journals`, `/admin/journals/new`, `/admin/journals/[id]/edit`
  - `/admin/articles`, `/admin/articles/new`, `/admin/articles/[id]/edit`
  - `/admin/projects`, `/admin/projects/new`, `/admin/projects/[id]/edit`
- Public published routes:
  - `/journals`, `/journals/[slug]`
  - `/articles`, `/articles/[slug]`
  - `/projects`, `/projects/[slug]`

Rich text storage strategy:
- Structured JSON is persisted in `Content.bodyJson`.
- Derived HTML is generated server-side and stored in `Content.bodyHtml` for stable rendering.

## Single-Admin Auth UX

- App sign-up is disabled:
  - `/sign-up` redirects to `/sign-in`
  - sign-in UI points sign-up links back to sign-in
- Beyond Blog assumes one existing admin account configured by env + seed.

## Clerk Settings

- Enable the application with your desired sign-in method.
- Set:
  - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
  - `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-in`
- Ensure allowed redirect URLs include:
  - `http://localhost:3000/sign-in`
  - `http://localhost:3000/admin`
  - `http://localhost:3000/unauthorized`

## UploadThing Setup

1. Create an UploadThing app and copy its token.
2. Add `UPLOADTHING_TOKEN` to `.env`.
3. Start the app and upload via `/admin/media`.

Media uploads are handled by `app/api/uploadthing/route.ts` and persisted into `MediaAsset` through `server/uploadthing/core.ts`.

## Media Library (V1)

- Admin route: `/admin/media`
- Asset types:
  - `IMAGE` (fully supported upload)
  - `FILE` (generic docs/files upload)
  - `VIDEO` (metadata-first entries for future provider workflows)
- Core actions:
  - upload
  - filter/search/sort
  - copy URL
  - edit metadata
  - delete
- pick existing image from content editor cover-image workflow

## Guest Interactions (V1)

- Public guests can like and comment on:
  - journals
  - articles
  - projects
  - courses
- Admin moderation route: `/admin/comments`
- Moderation statuses:
  - `PENDING`
  - `VISIBLE`
  - `HIDDEN`
  - `DELETED`
- Likes are anonymous and deduplicated per visitor token hash (no raw IP storage).
- `INTERACTION_TOKEN_SECRET` can be set in `.env` for stable hashing. If omitted, Clerk secret is used.

After pulling schema changes, run:

```bash
npm run db:migrate -- --name add_guest_interactions
npm run db:generate
```

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`
- `npm run check`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:migrate:deploy`
- `npm run db:migrate:status`
- `npm run db:push`
- `npm run db:seed`
- `npm run db:studio`

## Notes

- Public users are guests (no end-user auth tables).
- Admin route protection is in `proxy.ts` and server guards.
- tRPC endpoint: `/api/trpc`.
