import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

import { getCatalog } from "./catalog.functions";

export const catalogQueryOptions = queryOptions({
  queryKey: ["catalog"],
  queryFn: () => getCatalog(),
  staleTime: 60_000,
});

/** Live, active products. Use inside routes whose loader ran ensureQueryData(catalogQueryOptions). */
export function useCatalog() {
  return useSuspenseQuery(catalogQueryOptions).data;
}
