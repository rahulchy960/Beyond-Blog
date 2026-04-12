"use client";

import { RefreshCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { toUserErrorMessage } from "@/lib/errors/client";

type RetryPanelProps = {
  title: string;
  error: unknown;
  onRetry?: () => void;
  retryLabel?: string;
};

export function RetryPanel({
  title,
  error,
  onRetry,
  retryLabel = "Try again",
}: RetryPanelProps) {
  return (
    <ErrorState
      title={title}
      description={toUserErrorMessage(error)}
      action={
        onRetry ? (
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            <RefreshCcwIcon className="size-4" />
            {retryLabel}
          </Button>
        ) : null
      }
    />
  );
}
