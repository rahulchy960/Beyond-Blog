export function getSearchParam(
  value: string | string[] | undefined,
  fallback = "",
) {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

export function getSearchParamBoolean(value: string | string[] | undefined) {
  const normalized = getSearchParam(value).toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

