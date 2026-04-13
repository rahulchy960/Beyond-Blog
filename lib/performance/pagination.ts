export const DEFAULT_PUBLIC_PAGE_SIZE = 18;
export const DEFAULT_ADMIN_PAGE_SIZE = 20;
export const MAX_PUBLIC_PAGE_SIZE = 48;
export const MAX_ADMIN_PAGE_SIZE = 60;

export function parsePageParam(value: string | undefined, fallback = 1) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

export function parsePageSizeParam(
  value: string | undefined,
  fallback: number,
  max: number,
) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, max);
}

export function getTotalPages(totalItems: number, pageSize: number) {
  if (totalItems <= 0) return 1;
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function clampPage(page: number, totalPages: number) {
  return Math.max(1, Math.min(page, totalPages));
}

