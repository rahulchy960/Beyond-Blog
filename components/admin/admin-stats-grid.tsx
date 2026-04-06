"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/hooks/use-trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminStatsGrid() {
  const trpc = useTRPC();
  const dashboardStatsQuery = useQuery(trpc.admin.dashboardStats.queryOptions());

  if (dashboardStatsQuery.isPending) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={`admin-stats-loading-${index}`}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (dashboardStatsQuery.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unable to load dashboard stats</CardTitle>
          <CardDescription>
            {dashboardStatsQuery.error.message || "An unexpected error occurred."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {dashboardStatsQuery.data.map((stat) => (
        <Card key={stat.title}>
          <CardHeader>
            <CardTitle>{stat.title}</CardTitle>
            <CardDescription>{stat.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-semibold tracking-tight">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
