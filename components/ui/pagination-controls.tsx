import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { buttonVariants } from "@/lib/ui/button-variants";
import { cn } from "@/lib/utils";

type PaginationControlsProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  buildHref: (page: number) => string;
  className?: string;
};

function getTotalPages(totalItems: number, pageSize: number) {
  if (totalItems <= 0) return 1;
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function PaginationControls({
  page,
  pageSize,
  totalItems,
  buildHref,
  className,
}: PaginationControlsProps) {
  const totalPages = getTotalPages(totalItems, pageSize);

  if (totalPages <= 1) {
    return null;
  }

  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <div
      className={cn(
        "surface-inset flex items-center justify-between gap-3 px-3 py-2",
        className,
      )}
    >
      {hasPrevious ? (
        <Link href={buildHref(page - 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
          <ChevronLeftIcon className="size-4" />
          Previous
        </Link>
      ) : (
        <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-none opacity-55")}>
          <ChevronLeftIcon className="size-4" />
          Previous
        </span>
      )}

      <p className="text-xs font-medium text-muted-foreground">
        Page {page} of {totalPages}
      </p>

      {hasNext ? (
        <Link href={buildHref(page + 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
          Next
          <ChevronRightIcon className="size-4" />
        </Link>
      ) : (
        <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-none opacity-55")}>
          Next
          <ChevronRightIcon className="size-4" />
        </span>
      )}
    </div>
  );
}

