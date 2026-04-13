import { QueryClient, defaultShouldDehydrateQuery } from "@tanstack/react-query";
import { shouldRetryQuery } from "@/lib/errors/client";
import { queryGcTimes } from "@/lib/trpc/query-presets";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: queryGcTimes.default,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: false,
        retry(failureCount, error) {
          if (failureCount >= 2) {
            return false;
          }

          return shouldRetryQuery(error);
        },
        retryDelay: (attempt) => Math.min(800 * 2 ** attempt, 4_000),
      },
      mutations: {
        retry: false,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
    },
  });
}
