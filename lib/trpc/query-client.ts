import { QueryClient, defaultShouldDehydrateQuery } from "@tanstack/react-query";
import { shouldRetryQuery } from "@/lib/errors/client";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry(failureCount, error) {
          if (failureCount >= 1) {
            return false;
          }

          return shouldRetryQuery(error);
        },
        retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 4_000),
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
