"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { SearchIcon, ShieldCheckIcon } from "lucide-react";
import { useTRPC } from "@/hooks/use-trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { RetryPanel } from "@/components/ui/retry-panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { queryStaleTimes } from "@/lib/trpc/query-presets";

const timeRangeOptions = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "All time", value: "all" },
] as const;

type TimeRangeValue = (typeof timeRangeOptions)[number]["value"];

function metadataPreview(value: unknown) {
  if (!value || typeof value !== "object") {
    return "No metadata";
  }

  const entries = Object.entries(value as Record<string, unknown>).slice(0, 3);
  if (entries.length === 0) {
    return "No metadata";
  }

  return entries
    .map(([key, item]) => `${key}: ${typeof item === "string" ? item : JSON.stringify(item)}`)
    .join(" • ");
}

export function AdminAuditLogsScreen() {
  const trpc = useTRPC();
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRangeValue>("30d");

  const input = useMemo(
    () => ({
      query: query.trim() ? query.trim() : undefined,
      action: action.trim() ? action.trim() : undefined,
      entityType: entityType.trim() ? entityType.trim() : undefined,
      timeRange,
      limit: 30,
    }),
    [action, entityType, query, timeRange],
  );

  const listQuery = useInfiniteQuery(
    trpc.analytics.listAuditLogs.infiniteQueryOptions(input, {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      staleTime: queryStaleTimes.analytics,
    }),
  );
  const items = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [listQuery.data?.pages],
  );

  return (
    <div className="space-y-7">
      <PageHeader
        title="Audit Logs"
        description="Trace high-impact admin operations and inspect action metadata for operational accountability."
      />

      <div className="toolbar-row gap-3">
        <div className="relative min-w-[15rem] flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search action, entity type, or entity id"
            className="pl-9"
          />
        </div>
        <Input
          value={action}
          onChange={(event) => setAction(event.target.value)}
          placeholder="Action filter (e.g. content.publish)"
          className="min-w-[13rem] max-w-[17rem]"
        />
        <Input
          value={entityType}
          onChange={(event) => setEntityType(event.target.value)}
          placeholder="Entity type (e.g. CONTENT)"
          className="min-w-[11rem] max-w-[15rem]"
        />
        <div className="min-w-[11rem]">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRangeValue)}>
            <SelectTrigger>
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {listQuery.isPending ? (
        <Card className="surface-panel">
          <CardContent className="space-y-3 p-5">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </CardContent>
        </Card>
      ) : listQuery.isError ? (
        <RetryPanel
          title="Unable to load audit logs"
          error={listQuery.error}
          onRetry={() => listQuery.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ShieldCheckIcon}
          title="No audit events found"
          description="Try widening filters or generate new admin activity."
        />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <Card key={item.id} className="surface-panel">
              <CardHeader className="space-y-2 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{item.action}</Badge>
                  <Badge variant="secondary">{item.entityType}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <CardTitle className="text-base">{item.entityId}</CardTitle>
                <CardDescription>
                  By {item.admin.name} ({item.admin.email})
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{metadataPreview(item.metadata)}</p>
                {item.metadata ? (
                  <pre className="surface-inset overflow-x-auto p-3 text-xs leading-5 text-muted-foreground">
                    {JSON.stringify(item.metadata, null, 2)}
                  </pre>
                ) : null}
              </CardContent>
            </Card>
          ))}

          {listQuery.hasNextPage ? (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => listQuery.fetchNextPage()}
                disabled={listQuery.isFetchingNextPage}
              >
                {listQuery.isFetchingNextPage ? "Loading..." : "Load More"}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

