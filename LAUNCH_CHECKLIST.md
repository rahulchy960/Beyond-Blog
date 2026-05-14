# Beyond Blog v1 Launch Checklist

Use this checklist before each production launch.

## 1. Environment and Secrets

- [ ] `NEXT_PUBLIC_APP_URL` is set to the production HTTPS domain.
- [ ] `DATABASE_URL` and `DIRECT_URL` point to production Neon.
- [ ] Clerk production keys are configured (`pk_live_`, `sk_live_`).
- [ ] `UPLOADTHING_TOKEN` is configured.
- [ ] `ALLOWED_ADMIN_IDS` is set with the Clerk user IDs for allowed admins.
- [ ] `ALLOW_ADMIN_REASSIGN=false`.
- [ ] Optional secrets (`INTERACTION_TOKEN_SECRET`, `CLERK_WEBHOOK_SECRET`) are set if used.

## 2. Database Readiness

- [ ] All migrations are committed.
- [ ] `npm run db:migrate:deploy` has run successfully on production.
- [ ] `npm run db:migrate:status` shows up-to-date.
- [ ] Seed has been run if first deployment / admin changed (`npm run db:seed`).
- [ ] `AdminUser` owner exists and is active.

## 3. Auth and Access Control

- [ ] Admin can sign in at `/sign-in`.
- [ ] Non-authenticated `/admin` access redirects to sign-in.
- [ ] Non-admin authenticated users are blocked from admin routes.
- [ ] `/sign-up` is not available as a registration path.

## 4. Core Product Flows

- [ ] Content create/edit/publish/archive works (journals/articles/projects).
- [ ] Course create/edit + section/lesson management works.
- [ ] Quiz create/edit/publish and public attempt flow works.
- [ ] Media upload + library + picker works.
- [ ] Admin profile/footer settings save and render publicly.

## 5. Public Experience

- [ ] Homepage discovery sections render.
- [ ] Public list pages load (journals/articles/projects/courses/quizzes).
- [ ] Public detail pages load only published entities.
- [ ] Guest comments/likes/quizzes work as expected.
- [ ] Search and taxonomy pages function.

## 6. SEO and Indexing

- [ ] `/sitemap.xml` is generated and includes published public routes.
- [ ] `/robots.txt` disallows admin/api/auth paths.
- [ ] Canonical and OG metadata appear on core public pages.
- [ ] Admin/auth routes are noindex.

## 7. Analytics and Moderation

- [ ] Admin dashboard summary loads without errors.
- [ ] Analytics page and audit logs page load.
- [ ] Comments moderation actions work.
- [ ] Recent activity panels show expected data.

## 8. UX and Quality

- [ ] Light + dark mode both render correctly.
- [ ] Mobile and tablet layouts are verified.
- [ ] Loading/empty/error states are polished and non-broken.
- [ ] No obvious console/runtime errors on critical flows.

## 9. Build and Release

- [ ] `npm run check` passes locally or in CI.
- [ ] Production build is green on Vercel.
- [ ] Preview smoke test is complete before promoting to production.

## 10. Rollback Readiness

- [ ] Previous stable deployment is identified.
- [ ] Hotfix path is documented (branch, owner, DB change plan).
- [ ] Team knows rollback trigger criteria (critical auth/data/publish issues).
