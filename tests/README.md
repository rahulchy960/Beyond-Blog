# Testing Guide

## Stack
- Vitest + Testing Library for unit/component/integration tests
- Playwright for E2E
- MSW for network mocking in Vitest

## Structure
- `tests/unit`: unit and component tests
- `tests/integration`: tRPC and auth integration tests
- `tests/e2e`: Playwright E2E specs
- `tests/mocks`: MSW, Prisma, Clerk mocks
- `tests/factories`: deterministic test data builders
- `tests/utils`: shared render/tRPC test helpers

## Commands
- `npm run test`: run Vitest once
- `npm run test:watch`: run Vitest in watch mode
- `npm run test:coverage`: run coverage (80% thresholds configured)
- `npm run test:e2e`: run Playwright E2E
- `npm run test:e2e:ui`: run Playwright UI mode
- `npm run test:e2e:install`: install Chromium for Playwright

## Environment
- `.env.test` holds test-safe defaults
- Vitest additionally sets fallback env values in `setupTests.ts` to keep tests isolated from local secrets

## E2E Modes
### Baseline mode (no secrets)
- `tests/e2e/public-flows.spec.ts` runs the homepage and sign-up-disabled checks.
- Article/quiz flow tests auto-skip unless:
  - `E2E_ARTICLE_SLUG` is set
  - `E2E_QUIZ_SLUG` is set

### Full admin mode
- `tests/e2e/admin-flows.spec.ts` auto-skips unless:
  - `PLAYWRIGHT_ADMIN_STORAGE_STATE` points to a valid Playwright storage-state JSON file for a signed-in admin session.

Optional admin/public seeded data env vars:
- `E2E_ARTICLE_SLUG`
- `E2E_QUIZ_SLUG`
- `PLAYWRIGHT_ADMIN_STORAGE_STATE`
