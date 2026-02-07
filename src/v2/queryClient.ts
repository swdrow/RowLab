import { QueryClient } from '@tanstack/react-query';

/**
 * Global TanStack Query Client
 *
 * Configuration:
 * - 5-minute stale time (data stays fresh)
 * - 10-minute garbage collection (unused data cleanup)
 * - Single retry on query failure
 * - No refetch on window focus (reduces unnecessary requests)
 *
 * Multi-tab sync:
 * - BroadcastChannel synchronization enabled via initBroadcastSync() (called in V2Layout)
 * - Auth queries filtered out for security
 * - See: src/v2/lib/broadcastSync.ts
 */

// Create client outside component to avoid recreation on render
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (v5 renamed cacheTime)
      retry: 1, // Retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch on tab focus
    },
    mutations: {
      retry: 0, // Don't retry mutations
    },
  },
});
