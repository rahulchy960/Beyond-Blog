# Beyond Blog

Production-ready Next.js App Router foundation for a professor-led academic publishing platform.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Clerk (single admin auth only)
- tRPC v11 + TanStack React Query v5
- Prisma v7 + Neon PostgreSQL
- Zod

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

## Clerk Settings

- Enable the application with your desired sign-in method.
- Set:
  - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
  - `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- Ensure allowed redirect URLs include:
  - `http://localhost:3000/sign-in`
  - `http://localhost:3000/admin`
  - `http://localhost:3000/unauthorized`

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:push`
- `npm run db:seed`
- `npm run db:studio`

## Notes

- Public users are guests (no end-user auth tables).
- Admin route protection is in `proxy.ts` and server guards.
- tRPC endpoint: `/api/trpc`.
