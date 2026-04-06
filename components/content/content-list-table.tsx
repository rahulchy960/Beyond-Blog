"use client";

import { format } from "date-fns";
import { SearchIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ContentActionsMenu } from "@/components/content/content-actions-menu";
import { ContentStatusBadge } from "@/components/content/content-status-badge";
import { useTRPC } from "@/hooks/use-trpc";
import { type ContentType, type PublishStatus } from "@/lib/content/enums";
import { contentTypeMeta } from "@/lib/content/constants";
import { buttonVariants } from "@/lib/ui/button-variants";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    <div className="space-y-4 rounded-xl border border-border/80 bg-card/60 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold">{contentMeta.plural}</h2>
          <p className="text-sm text-muted-foreground">Manage drafts, published, and archived items.</p>
        </div>
        <Link href={`${contentMeta.adminBasePath}/new`} className={buttonVariants({ size: "sm" })}>
          New {contentMeta.singular}
        </Link>
      </div>

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

        <Select
          value={status}
          onValueChange={(value) => setStatus((value ?? "all") as "all" | PublishStatus)}
        >
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>Published</TableHead>
            <TableHead>Featured</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {listQuery.isPending ? (
            <TableRow>
              <TableCell colSpan={6} className="text-sm text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-sm text-muted-foreground">
                No items found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="max-w-[500px] space-y-1">
                    <Link
                      href={`${contentMeta.adminBasePath}/${row.id}/edit`}
                      className={cn(buttonVariants({ variant: "link", size: "sm" }), "h-auto p-0")}
                    >
                      {row.title}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">{row.slug}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <ContentStatusBadge status={row.publishStatus} />
                </TableCell>
                <TableCell>{format(row.updatedAt, "MMM d, yyyy")}</TableCell>
                <TableCell>
                  {row.publishedAt ? format(row.publishedAt, "MMM d, yyyy") : "Not published"}
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
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
