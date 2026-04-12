import { Prisma } from "@prisma/client";

export function isAnalyticsSchemaError(error: unknown) {
  const message =
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
      ? (error as { message: string }).message
      : String(error ?? "");
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  if (message.includes('invalid input value for enum "CommentStatus"')) {
    return true;
  }

  if (
    message.includes("does not exist in the current database") ||
    message.includes("relation") ||
    message.includes("The column `(not available)` does not exist") ||
    (message.includes("column") && message.includes("does not exist"))
  ) {
    return true;
  }

  if (code === "P2021" || code === "P2022" || code === "P2010") {
    return true;
  }

  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code === "P2021" || error.code === "P2022") {
    return true;
  }

  if (error.code === "P2010") {
    return true;
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

