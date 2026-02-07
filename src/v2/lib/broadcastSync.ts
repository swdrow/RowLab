/**
 * Multi-tab Cache Synchronization via BroadcastChannel
 *
 * Keeps TanStack Query cache in sync across browser tabs using the BroadcastChannel API.
 * Auth queries are filtered out for security (prevents tokens from being broadcast).
 *
 * Usage: Call initBroadcastSync() once in the app root (V2Layout).
 *
 * @see https://tanstack.com/query/v5/docs/framework/react/plugins/broadcastQueryClient
 */

import { broadcastQueryClient } from '@tanstack/query-broadcast-client-experimental';
import { queryClient } from '../queryClient';
import type { Query } from '@tanstack/react-query';

let initialized = false;

/**
 * Initialize multi-tab cache synchronization.
 * Must be called once at app initialization.
 */
export function initBroadcastSync() {
  if (initialized) return;
  initialized = true;

  broadcastQueryClient({
    queryClient,
    broadcastChannel: 'rowlab-v3',
    // Security: Don't broadcast auth queries (tokens shouldn't cross tabs)
    predicate: (query: Query) => {
      const queryKey = query.queryKey;
      if (Array.isArray(queryKey) && queryKey.length > 0) {
        const firstKey = queryKey[0];
        // Filter out auth queries
        if (firstKey === 'auth') {
          return false;
        }
      }
      return true;
    },
  });
}
