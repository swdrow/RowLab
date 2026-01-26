// src/v2/features/live-erg/hooks/useLiveErgPolling.ts
// TanStack Query hooks for live erg data polling

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../../../../store/authStore';
import api from '../../../utils/api';
import type { LiveSessionData, PollingConfig } from '../../../types/live-erg';
import { DEFAULT_POLLING_INTERVAL } from '../../../types/live-erg';

// ============================================
// QUERY KEYS
// ============================================

export const liveErgKeys = {
  all: ['live-erg'] as const,
  session: (sessionId: string) => [...liveErgKeys.all, 'session', sessionId] as const,
};

// ============================================
// API TYPES
// ============================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================
// API FUNCTIONS
// ============================================

async function fetchLiveErgData(sessionId: string): Promise<LiveSessionData> {
  const response = await api.get<ApiResponse<LiveSessionData>>(
    `/api/v1/sessions/${sessionId}/live-data`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch live erg data');
  }

  return response.data.data;
}

// ============================================
// HOOKS
// ============================================

interface UseLiveErgPollingOptions {
  sessionId: string;
  config?: Partial<PollingConfig>;
}

/**
 * Fetches live erg data with configurable polling interval
 * Uses TanStack Query's refetchInterval for automatic polling
 */
export function useLiveErgPolling({
  sessionId,
  config = {},
}: UseLiveErgPollingOptions) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  const pollingConfig: PollingConfig = {
    interval: config.interval ?? DEFAULT_POLLING_INTERVAL,
    enabled: config.enabled ?? true,
  };

  const query = useQuery({
    queryKey: liveErgKeys.session(sessionId),
    queryFn: () => fetchLiveErgData(sessionId),
    enabled: isInitialized && isAuthenticated && !!sessionId && pollingConfig.enabled,
    // Poll at configured interval when enabled
    refetchInterval: pollingConfig.enabled ? pollingConfig.interval : false,
    // Continue polling in background when tab is inactive
    refetchIntervalInBackground: true,
    // Data considered fresh for half the polling interval
    staleTime: pollingConfig.interval / 2,
    // Don't refetch on window focus (polling handles freshness)
    refetchOnWindowFocus: false,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    dataUpdatedAt: query.dataUpdatedAt,
    refetch: query.refetch,
  };
}

/**
 * Hook to control polling state (pause/resume, interval adjustment)
 */
export function usePollingControls(
  initialEnabled = true,
  initialInterval = DEFAULT_POLLING_INTERVAL
) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [interval, setIntervalValue] = useState(initialInterval);

  const pause = () => setEnabled(false);
  const resume = () => setEnabled(true);
  const toggle = () => setEnabled((prev) => !prev);
  const setPollingInterval = (ms: number) => setIntervalValue(Math.max(1000, ms)); // Min 1 second

  return {
    enabled,
    interval,
    pause,
    resume,
    toggle,
    setPollingInterval,
    config: { enabled, interval },
  };
}
