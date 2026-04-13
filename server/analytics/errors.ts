import { Prisma } from "@prisma/client";

function getMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return String(error ?? "");
}

function getCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code?: unknown }).code ?? "");
  }

  return "";
}

function isSchemaDriftMessage(message: string) {
  const text = message.toLowerCase();

  if (text.includes('invalid input value for enum "commentstatus"')) {
    return true;
  }

  if (text.includes("the column `(not available)` does not exist")) {
    return true;
  }

  if (text.includes("does not exist in the current database")) {
    return true;
  }

  if (text.includes("relation") && text.includes("does not exist")) {
    return true;
  }

  if (text.includes("column") && text.includes("does not exist")) {
    return true;
  }

  if (text.includes("invalid `") && text.includes("invocation") && text.includes("does not exist")) {
    return true;
  }

  if (
    text.includes("failed to deserialize column of type 'name'") ||
    text.includes("unsupported") && text.includes("$queryraw")
  ) {
    return true;
  }

  return false;
}

function getNestedErrors(error: unknown) {
  if (!error || typeof error !== "object") {
    return [];
  }

  const nested: unknown[] = [];
  const maybeCause = (error as { cause?: unknown }).cause;
  if (maybeCause) {
    nested.push(maybeCause);
  }

  const maybeErrors = (error as { errors?: unknown[] }).errors;
  if (Array.isArray(maybeErrors)) {
    nested.push(...maybeErrors);
  }

  return nested;
}

export function isAnalyticsSchemaError(error: unknown) {
  const message = getMessage(error);
  const code = getCode(error);

  if (isSchemaDriftMessage(message)) {
    return true;
  }

  if (code === "P2021" || code === "P2022" || code === "P2010") {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021" || error.code === "P2022" || error.code === "P2010") {
      return true;
    }
  }

  for (const nested of getNestedErrors(error)) {
    if (isAnalyticsSchemaError(nested)) {
      return true;
    }
  }

  return false;
}

export async function safeAnalyticsQuery<T>(
  query: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await query();
  } catch (error) {
    if (isAnalyticsSchemaError(error)) {
      return fallback;
    }

    throw error;
  }
}
