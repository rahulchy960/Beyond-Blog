# Professor Academic Platform

Production-grade Next.js App Router foundation for an academic content platform with:

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Clerk authentication
- tRPC v11 + TanStack React Query v5 (new `@trpc/tanstack-react-query` integration)
- Prisma ORM + Neon PostgreSQL
- Zod validation

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Fill all `.env` values (see setup sections below).

4. Generate Prisma client and apply schema:

```bash
npm run db:generate
npm run db:push
```

5. Start development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Clerk Setup (Manual)

1. Create a Clerk application at https://dashboard.clerk.com.
2. In Clerk dashboard, copy:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
3. Set URLs in `.env`:
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
4. In Clerk, set allowed redirect URLs to include:
- `http://localhost:3000/sign-in`
- `http://localhost:3000/sign-up`
- `http://localhost:3000/admin`

## Neon Setup (Manual)

1. Create a Neon project at https://console.neon.tech.
2. Copy two connection strings into `.env`:
- `DATABASE_URL`: pooled connection (runtime)
- `DIRECT_URL`: direct connection (migrations/introspection)
3. Ensure SSL parameters are included (`sslmode=require`).
4. Run:

```bash
npm run db:push
```

## Admin Authorization Setup

All users sync into `User` table on sign-in. Default role is `USER`.

To promote your professor account to `ADMIN`:

1. Sign in once to create your `User` record.
2. Open Prisma Studio:

```bash
npm run db:studio
```

3. Change that row’s `role` to `ADMIN`.

## Scripts

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - lint codebase
- `npm run db:generate` - generate Prisma client
- `npm run db:migrate` - create/apply local migrations
- `npm run db:push` - push Prisma schema to DB
- `npm run db:studio` - open Prisma Studio

## Notes

- Route auth protection is enforced in `proxy.ts`.
- Role-based authorization is enforced in `app/(admin)/admin/layout.tsx`.
- tRPC endpoint is at `/api/trpc`.

## Troubleshooting

- `Publishable key not valid`:
  Replace `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `.env` with real values from Clerk, then restart `npm run dev`.
- Prisma import/build errors around `PrismaClient`:
  Run `npm install` (which now runs `postinstall -> prisma generate`) or run `npm run db:generate` manually.
