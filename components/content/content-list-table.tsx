"use client";

import { type ContentType, type PublishStatus } from "@/lib/content/enums";
import { format } from "date-fns";
import { SearchIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

type ContentListTableProps = {
  type: ContentType;
};

export function ContentListTable({ type }: ContentListTableProps) {
  const trpc = useTRPC();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | PublishStatus>("all");
  const [featured, setFeatured] = useState<"all" | "featured" | "not_featured">("all");

  const contentMeta = contentTypeMeta[type];
  const listQuery = useQuery(
    trpc.content.listForAdmin.queryOptions({
      type,
      query: query || undefined,
      status: status === "all" ? undefined : status,
      featured,
      limit: 80,
    }),
  );

  const rows = useMemo(() => listQuery.data?.items ?? [], [listQuery.data?.items]);

  return (
    <div className="surface-panel space-y-4 p-4 md:p-5">
      <div className="grid gap-2 md:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${contentMeta.plural.toLowerCase()}`}
            className="pl-9"
          />
        </div>

        <Select value={status} onValueChange={(value) => setStatus((value ?? "all") as "all" | PublishStatus)}>
          <SelectTrigger className="w-full">
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
            setFeatured((value ?? "all") as "all" | "featured" | "not_featured")
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter featured" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entries</SelectItem>
            <SelectItem value="featured">Featured only</SelectItem>
            <SelectItem value="not_featured">Not featured</SelectItem>
          </SelectContent>
        </Select>
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
        <div className="overflow-hidden rounded-xl border border-border/80 bg-card/65">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/55">
                <TableHead className="px-3">Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-3">
                    <div className="max-w-[520px] space-y-1.5">
                      <Link
                        href={`${contentMeta.adminBasePath}/${row.id}/edit`}
                        className={cn(buttonVariants({ variant: "link", size: "sm" }), "h-auto p-0 text-left")}
                      >
                        {row.title}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">{row.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ContentStatusBadge status={row.publishStatus} />
                  </TableCell>
                  <TableCell>{format(new Date(row.updatedAt), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    {row.publishedAt ? format(new Date(row.publishedAt), "MMM d, yyyy") : "Not published"}
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
    </div>
  );
}
