"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { SearchIcon, SparklesIcon } from "lucide-react";
import { useTRPC } from "@/hooks/use-trpc";
import { type QuizStatus } from "@/lib/content/enums";
import { quizStatusOptions } from "@/lib/quiz/constants";
import { cn } from "@/lib/utils";
import { QuizActionsMenu } from "@/components/quiz/quiz-actions-menu";
import { QuizStatusBadge } from "@/components/quiz/quiz-status-badge";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/loading-skeletons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buttonVariants } from "@/lib/ui/button-variants";
import { DataPagination } from "@/components/ui/data-pagination";
import { queryStaleTimes } from "@/lib/trpc/query-presets";

export function QuizListTable() {
  const trpc = useTRPC();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | QuizStatus>("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const deferredQuery = useMemo(() => query.trim(), [query]);

  const listQuery = useQuery(
    trpc.quiz.listForAdmin.queryOptions({
      query: deferredQuery || undefined,
      status: status === "all" ? undefined : status,
      sort: "updated",
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
            className="pl-10"
            placeholder="Search quizzes by title, slug, or description"
          />
        </div>

        <Select
          value={status}
          onValueChange={(value) => {
            setStatus((value ?? "all") as "all" | QuizStatus);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[11.5rem]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {quizStatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {listQuery.isPending ? (
        <TableSkeleton rows={7} />
      ) : listQuery.isError ? (
        <EmptyState title="Unable to load quizzes" description={listQuery.error.message} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No quizzes found"
          description="Create your first quiz to start publishing interactive assessments."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((quiz) => (
            <article key={quiz.id} className="surface-panel-strong p-4 md:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <QuizStatusBadge status={quiz.status} />
                    {quiz.isFeatured ? (
                      <Badge variant="secondary" className="gap-1">
                        <SparklesIcon className="size-3" />
                        Featured
                      </Badge>
                    ) : null}
                    <Badge variant="outline">{quiz._count.questions} questions</Badge>
                    <Badge variant="outline">{quiz._count.attempts} attempts</Badge>
                  </div>

                  <div className="space-y-1">
                    <Link
                      href={`/admin/quizzes/${quiz.id}/edit`}
                      className={cn(
                        buttonVariants({ variant: "link", size: "sm" }),
                        "h-auto p-0 text-left text-xl font-semibold text-foreground no-underline hover:no-underline",
                      )}
                    >
                      {quiz.title}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">{quiz.slug}</p>
                  </div>

                  {quiz.description ? (
                    <p className="line-clamp-2 text-sm leading-7 text-muted-foreground">{quiz.description}</p>
                  ) : null}
                </div>

                <div className="flex items-start gap-2">
                  <div className="hidden text-right text-xs text-muted-foreground sm:block">
                    <p>Updated {format(new Date(quiz.updatedAt), "MMM d, yyyy")}</p>
                    <p>
                      {quiz.publishedAt
                        ? `Published ${format(new Date(quiz.publishedAt), "MMM d, yyyy")}`
                        : "Not published"}
                    </p>
                  </div>
                  <QuizActionsMenu
                    id={quiz.id}
                    status={quiz.status}
                    isFeatured={quiz.isFeatured}
                    editHref={`/admin/quizzes/${quiz.id}/edit`}
                  />
                </div>
              </div>
            </article>
          ))}
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
