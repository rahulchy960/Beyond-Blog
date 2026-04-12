"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCcwIcon } from "lucide-react";
import { SiteContainer } from "@/components/layout/site-container";
import { Button, buttonVariants } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { toUserErrorMessage } from "@/lib/errors/client";

type PublicErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PublicErrorPage({ error, reset }: PublicErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="py-12 md:py-16">
      <SiteContainer className="max-w-3xl">
        <ErrorState
          title="Unable to load this page"
          description={toUserErrorMessage(error, "The page failed to load. Please try again.")}
          action={
            <>
              <Button type="button" size="sm" onClick={reset}>
                <RefreshCcwIcon className="size-4" />
                Retry
              </Button>
              <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Go to homepage
              </Link>
            </>
          }
        />
      </SiteContainer>
    </div>
  );
}
