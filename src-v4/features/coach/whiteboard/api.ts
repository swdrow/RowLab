/**
 * Whiteboard API functions, query keys, and option factories.
 *
 * Backend: GET /api/v1/whiteboards/latest — fetch latest whiteboard
 *          POST /api/v1/whiteboards       — create or update (upsert by team + date)
 *
 * Uses v1 API namespace (existing backend routes, not unified auth router).
 */
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api';
import type { WhiteboardEntry, SaveWhiteboardInput } from './types';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const whiteboardKeys = {
  all: ['whiteboard'] as const,
  latest: () => ['whiteboard', 'latest'] as const,
};

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

async function fetchLatestWhiteboard(): Promise<WhiteboardEntry | null> {
  try {
    const data = await apiClient.get<{ whiteboard: WhiteboardEntry | null }>(
      '/api/v1/whiteboards/latest'
    );
    return data.whiteboard ?? null;
  } catch (error: unknown) {
    // 404 is expected when no whiteboard exists yet
    if (error instanceof ApiClientError && error.status === 404) return null;
    throw error;
  }
}

async function saveWhiteboard(input: SaveWhiteboardInput): Promise<WhiteboardEntry> {
  const data = await apiClient.post<{ whiteboard: WhiteboardEntry }>('/api/v1/whiteboards', input);
  return data.whiteboard;
}

// ---------------------------------------------------------------------------
// Query option factory
// ---------------------------------------------------------------------------

export function whiteboardOptions() {
  return queryOptions<WhiteboardEntry | null>({
    queryKey: whiteboardKeys.latest(),
    queryFn: fetchLatestWhiteboard,
    staleTime: 60_000, // 1 minute -- whiteboards change infrequently
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useSaveWhiteboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveWhiteboard,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: whiteboardKeys.all });
      const previous = queryClient.getQueryData(whiteboardKeys.latest());

      // Optimistic update -- merge with existing data to preserve author/id
      if (previous && typeof previous === 'object') {
        queryClient.setQueryData(whiteboardKeys.latest(), { ...previous, ...input });
      }

      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(whiteboardKeys.latest(), context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(whiteboardKeys.latest(), data);
    },
  });
}
