# Security Notes

Beyond Blog is a single-admin platform with public read + guest interaction flows.

## Authentication and Authorization

- Edge protection for `/admin` lives in [`proxy.ts`](./proxy.ts) via Clerk middleware.
- Server-side authorization is enforced with admin guards (`requireAdmin`) and admin-only tRPC procedures.
- Sign-up is disabled in-app:
  - `/sign-up` redirects to `/sign-in`
  - Clerk sign-up URL is configured to `/sign-in`

## Security Headers

Configured in [`next.config.ts`](./next.config.ts):

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (camera/microphone/geolocation/payment/usb disabled)
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-site`
- `Strict-Transport-Security`
- `X-Robots-Tag` for admin/auth routes

## Env and Secret Handling

- Runtime env validation is centralized in [`lib/env.ts`](./lib/env.ts).
- Secrets are server-only (`CLERK_SECRET_KEY`, DB URLs, UploadThing token).
- Production boot fails fast on invalid/missing critical variables.

## Input Validation

- API inputs use Zod validation in tRPC routers.
- Guest interaction payloads (comments/likes/quiz attempts) are validated server-side.
- Rich text payloads are normalized/sanitized before storage/rendering (`lib/content/rich-text.ts`).

## Upload Security

- UploadThing route is admin-only (`server/uploadthing/core.ts`).
- File type/size limits are enforced by UploadThing config and middleware checks.
- Media deletes are provider-aware (`server/media/provider.ts`).

## Indexing and Private Routes

- `robots.ts` disallows `/admin`, `/api`, auth routes.
- Admin layout metadata also marks admin pages as noindex.

## Operational Security Checklist

- Use live Clerk keys in production only.
- Keep `ALLOW_ADMIN_REASSIGN=false` by default.
- Rotate secrets when team/admin ownership changes.
- Restrict Vercel env variable access to trusted maintainers.
- Review audit logs after high-impact admin actions.

## Recommended Next Security Enhancements

- Add production CSP with nonce-based script policy after validating Clerk and UploadThing script origins.
- Add external centralized error monitoring + alerting.
- Add optional rate limiting middleware for guest interaction endpoints.
