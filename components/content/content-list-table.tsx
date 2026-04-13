"use client";

import { type ContentType, type PublishStatus } from "@/lib/content/enums";
import { format } from "date-fns";
import { SearchIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ContentActionsMenu } from "@/components/content/content-actions-menu";
import { ContentStatusBadge } from "@/components/content/content-status-badge";
import { useTRPC } from "@/hooks/use-trpc";
import { contentTypeMeta } from "@/lib/content/constants";
import { buttonVariants } from "@/lib/ui/button-variants";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/loading-skeletons";
import { DataPagination } from "@/components/ui/data-pagination";
import { queryStaleTimes } from "@/lib/trpc/query-presets";

type ContentListTableProps = {
  type: ContentType;
};

export function ContentListTable({ type }: ContentListTableProps) {
  const trpc = useTRPC();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | PublishStatus>("all");
  const [featured, setFeatured] = useState<"all" | "featured" | "not_featured">("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const deferredQuery = useMemo(() => query.trim(), [query]);

  const contentMeta = contentTypeMeta[type];
  const listQuery = useQuery(
    trpc.content.listForAdmin.queryOptions({
      type,
      query: deferredQuery || undefined,
      status: status === "all" ? undefined : status,
      featured,
      page,
      pageSize,
    },
    {
      placeholderData: keepPreviousData,
      staleTime: queryStaleTimes.adminLists,
    }),
  );

  const rows = useMemo(() => listQuery.data?.items ?? [], [listQuery.data?.items]);
  const publishedCount = useMemo(
    () => rows.filter((row) => row.publishStatus === "PUBLISHED").length,
    [rows],
  );

  return (
    <div className="space-y-4">
      <div className="toolbar-row">
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder={`Search ${contentMeta.plural.toLowerCase()} by title, slug, or summary`}
            className="pl-10"
          />
        </div>

        <Select
          value={status}
          onValueChange={(value) => {
            setStatus((value ?? "all") as "all" | PublishStatus);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[11.5rem]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={featured}
          onValueChange={(value) =>
            {
              setFeatured((value ?? "all") as "all" | "featured" | "not_featured");
              setPage(1);
            }
          }
        >
          <SelectTrigger className="w-[11.5rem]">
            <SelectValue placeholder="Filter featured" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entries</SelectItem>
            <SelectItem value="featured">Featured only</SelectItem>
            <SelectItem value="not_featured">Not featured</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto hidden items-center gap-4 text-xs text-muted-foreground md:flex">
          <p>Total: {listQuery.data?.total ?? rows.length}</p>
          <p>Published: {publishedCount}</p>
        </div>
      </div>

      {listQuery.isPending ? (
        <TableSkeleton />
      ) : listQuery.isError ? (
        <EmptyState
          title="Unable to load content"
          description={listQuery.error.message || "An unexpected error occurred while loading content."}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title={`No ${contentMeta.plural.toLowerCase()} found`}
          description="Try changing your filters or create a new entry to start publishing."
        />
      ) : (
        <div className="data-table-shell">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/45">
                <TableHead className="px-3">Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="w-[54px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-3">
                    <div className="max-w-[580px] space-y-1.5">
                      <Link
                        href={`${contentMeta.adminBasePath}/${row.id}/edit`}
                        className={cn(
                          buttonVariants({ variant: "link", size: "sm" }),
                          "h-auto p-0 text-left text-[0.95rem] font-medium text-foreground",
                        )}
                      >
                        {row.title}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">{row.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ContentStatusBadge status={row.publishStatus} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(row.updatedAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {row.publishedAt ? (
                      format(new Date(row.publishedAt), "MMM d, yyyy")
                    ) : (
                      <span className="text-sm text-muted-foreground">Not published</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.isFeatured ? (
                      <Badge variant="secondary" className="gap-1">
                        <SparklesIcon className="size-3" />
                        Featured
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <ContentActionsMenu
                      id={row.id}
                      status={row.publishStatus}
                      isFeatured={row.isFeatured}
                      editHref={`${contentMeta.adminBasePath}/${row.id}/edit`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <DataPagination
        page={listQuery.data?.page ?? page}
        pageSize={listQuery.data?.pageSize ?? pageSize}
        totalItems={listQuery.data?.total ?? 0}
        disabled={listQuery.isFetching}
        onPageChange={setPage}
      />
    </div>
  );
}
