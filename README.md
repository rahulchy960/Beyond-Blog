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
