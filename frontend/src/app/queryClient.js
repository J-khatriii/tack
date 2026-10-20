import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data lives in this browser and only changes through our own mutations,
      // so it never goes stale by itself and never needs a background refetch.
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});
