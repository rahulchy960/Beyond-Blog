"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DataPaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  className?: string;
  disabled?: boolean;
};

function getTotalPages(totalItems: number, pageSize: number) {
  if (totalItems <= 0) return 1;
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function DataPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  className,
  disabled,
}: DataPaginationProps) {
  const totalPages = getTotalPages(totalItems, pageSize);

  if (totalPages <= 1) {
    return null;
  }

  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div
      className={cn(
        "surface-inset flex items-center justify-between gap-3 px-3 py-2",
        className,
      )}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={!canGoPrevious || disabled}
      >
        <ChevronLeftIcon className="size-4" />
        Previous
      </Button>

      <p className="text-xs font-medium text-muted-foreground">
        Page {page} of {totalPages}
      </p>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={!canGoNext || disabled}
      >
        Next
        <ChevronRightIcon className="size-4" />
      </Button>
    </div>
  );
}

