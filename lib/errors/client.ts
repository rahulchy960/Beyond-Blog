type TrpcLikeError = {
  message?: string;
  data?: {
    code?: string;
    httpStatus?: number;
  };
};

function isTrpcLikeError(error: unknown): error is TrpcLikeError {
  return typeof error === "object" && error !== null;
}

function getErrorCode(error: unknown) {
  if (!isTrpcLikeError(error)) {
    return null;
  }

  return error.data?.code ?? null;
}

function getRawMessage(error: unknown) {
  if (!isTrpcLikeError(error)) {
    return null;
  }

  return typeof error.message === "string" ? error.message : null;
}

export function toUserErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  const code = getErrorCode(error);
  if (code === "UNAUTHORIZED") {
    return "Your session is no longer valid. Please sign in again.";
  }
  if (code === "FORBIDDEN") {
    return "You don't have permission to perform this action.";
  }
  if (code === "NOT_FOUND") {
    return "The requested resource could not be found.";
  }
  if (code === "CONFLICT") {
    return "This action conflicts with existing data. Refresh and try again.";
  }
  if (code === "TOO_MANY_REQUESTS") {
    return "Too many requests in a short time. Please wait and retry.";
  }
  if (code === "PRECONDITION_FAILED") {
    return "A required setup step is missing. Please complete migrations/setup and retry.";
  }
  if (code === "BAD_REQUEST") {
    const message = getRawMessage(error);
    return message ?? "Some submitted values are invalid. Please review and try again.";
  }

  const message = getRawMessage(error);
  if (!message) {
    return fallback;
  }

  const lower = message.toLowerCase();
  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return "Network connection issue. Check connectivity and try again.";
  }

  return message;
}

export function shouldRetryQuery(error: unknown) {
  const code = getErrorCode(error);
  if (!code) {
    return true;
  }

  return ![
    "BAD_REQUEST",
    "UNAUTHORIZED",
    "FORBIDDEN",
    "NOT_FOUND",
    "CONFLICT",
    "PRECONDITION_FAILED",
  ].includes(code);
}
