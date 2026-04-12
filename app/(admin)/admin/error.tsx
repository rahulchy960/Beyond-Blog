"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { buttonVariants } from "@/lib/ui/button-variants";
import { toUserErrorMessage } from "@/lib/errors/client";

type AdminErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminErrorPage({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="Admin surface failed to load"
      description={toUserErrorMessage(
        error,
        "Something interrupted the admin request. You can retry safely.",
      )}
      action={
        <>
          <Button type="button" size="sm" onClick={reset}>
            <RefreshCcwIcon className="size-4" />
            Retry
          </Button>
          <Link href="/admin" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Back to dashboard
          </Link>
        </>
      }
    />
  );
}
