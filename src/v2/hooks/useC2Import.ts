import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import api from '../utils/api';
import { toast } from 'sonner';
import type { ApiResponse } from '../types/ergTests';

/**
 * C2 logbook entry for browsing
 */
export interface C2LogbookEntry {
  id: string;
  date: string;
  distance: number;
  time: number;
  machineType: string;
  alreadyImported: boolean;
  // Additional fields from C2 API
  avgPace?: number;
  avgWatts?: number;
  strokeRate?: number;
}

/**
 * Browse C2 logbook response
 */
export interface C2LogbookBrowseResult {
  results: C2LogbookEntry[];
  page: number;
  perPage: number;
  totalPages: number;
  totalResults: number;
}

/**
 * Historical import result
 */
export interface C2HistoricalImportResult {
  imported: number;
  skipped: number;
  errors?: Array<{ resultId: string; error: string }>;
}

/**
 * Hook for browsing C2 logbook
 */
export function useC2LogbookBrowse(options: {
  page: number;
  perPage: number;
  fromDate?: string;
  toDate?: string;
  enabled?: boolean;
}) {
  const { page, perPage, fromDate, toDate, enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.concept2.logbookBrowse(page, perPage, fromDate, toDate),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
      });
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);

      const res = await api.get<ApiResponse<C2LogbookBrowseResult>>(
        `/api/v1/concept2/logbook/browse?${params}`
      );

      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error?.message || 'Failed to browse C2 logbook');
      }

      return res.data.data;
    },
    enabled,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook for importing C2 historical workouts
 */
export function useC2HistoricalImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { fromDate?: string; toDate?: string; resultIds?: string[] }) => {
      const res = await api.post<ApiResponse<C2HistoricalImportResult>>(
        '/api/v1/concept2/historical-import',
        params
      );

      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error?.message || 'Failed to import C2 workouts');
      }

      return res.data.data;
    },
    onSuccess: (data) => {
      const msg =
        data.skipped > 0
          ? `Imported ${data.imported} workouts (${data.skipped} already existed)`
          : `Imported ${data.imported} workouts`;
      toast.success(msg);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.ergTests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.concept2.logbookBrowse() });
      queryClient.invalidateQueries({ queryKey: queryKeys.activityFeed.all });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || error.message || 'Unknown error';
      toast.error('Import failed: ' + message);
    },
  });
}
