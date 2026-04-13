"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { SearchIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { CourseActionsMenu } from "@/components/course/course-actions-menu";
import { CourseStatusBadge } from "@/components/course/course-status-badge";
import { useTRPC } from "@/hooks/use-trpc";
import { courseDifficultyLabels } from "@/lib/course/constants";
import { type CourseStatus } from "@/lib/content/enums";
import { buttonVariants } from "@/lib/ui/button-variants";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/loading-skeletons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataPagination } from "@/components/ui/data-pagination";
import { queryStaleTimes } from "@/lib/trpc/query-presets";

export function CourseListTable() {
  const trpc = useTRPC();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | CourseStatus>("all");
  const [featured, setFeatured] = useState<"all" | "featured" | "not_featured">("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const deferredQuery = useMemo(() => query.trim(), [query]);

  const listQuery = useQuery(
    trpc.course.listForAdmin.queryOptions({
      query: deferredQuery || undefined,
      status: status === "all" ? undefined : status,
      featured,
      page,
      pageSize,
    }, {
      placeholderData: keepPreviousData,
      staleTime: queryStaleTimes.adminLists,
    }),
  );

  const rows = useMemo(() => listQuery.data?.items ?? [], [listQuery.data?.items]);

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
            placeholder="Search courses by title, slug, or summary"
            className="pl-10"
          />
        </div>

        <Select
          value={status}
          onValueChange={(value) => {
            setStatus((value ?? "all") as "all" | CourseStatus);
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
          onValueChange={(value) => {
            setFeatured((value ?? "all") as "all" | "featured" | "not_featured");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[11.5rem]">
            <SelectValue placeholder="Filter featured" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All courses</SelectItem>
            <SelectItem value="featured">Featured only</SelectItem>
            <SelectItem value="not_featured">Not featured</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {listQuery.isPending ? (
        <TableSkeleton rows={6} />
      ) : listQuery.isError ? (
        <EmptyState title="Unable to load courses" description={listQuery.error.message} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No courses found"
          description="Create your first course to start building structured learning paths."
        />
      ) : (
        <div className="data-table-shell">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/45">
                <TableHead className="px-3">Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Lessons</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="w-[54px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-3">
                    <div className="max-w-[520px] space-y-1.5">
                      <Link
                        href={`/admin/courses/${row.id}/edit`}
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
                    <CourseStatusBadge status={row.status} />
                  </TableCell>
                  <TableCell>
                    {row.difficultyLevel ? (
                      <span className="text-sm">{courseDifficultyLabels[row.difficultyLevel]}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{row._count.lessons}</span>
                      {row.isFeatured ? (
                        <Badge variant="secondary" className="gap-1">
                          <SparklesIcon className="size-3" />
                          Featured
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(row.updatedAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {row.publishedAt ? (
                      format(new Date(row.publishedAt), "MMM d, yyyy")
                    ) : (
                      <span className="text-xs text-muted-foreground">Not published</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <CourseActionsMenu
                      id={row.id}
                      status={row.status}
                      isFeatured={row.isFeatured}
                      editHref={`/admin/courses/${row.id}/edit`}
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

