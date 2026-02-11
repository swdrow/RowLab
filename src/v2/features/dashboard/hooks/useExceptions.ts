/**
 * Exception Aggregation Hook
 * Phase 27-01: Aggregates red/yellow/green alerts from multiple domains
 * Phase 36.1-04: Fetches from real backend exception aggregation endpoint
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../utils/api';
import { queryKeys } from '../../../lib/queryKeys';
import { useAuth } from '../../../contexts/AuthContext';
import type { ExceptionSeverity, ExceptionItem, ExceptionSummary } from '../types';

interface UseExceptionsReturn {
  summary: ExceptionSummary;
  isLoading: boolean;
  widgetExceptions: Record<string, ExceptionItem[]>;
}

/**
 * Utility to map severity to CSS color classes
 */
export function getExceptionColor(severity: ExceptionSeverity): {
  text: string;
  bg: string;
} {
  switch (severity) {
    case 'critical':
      return {
        text: 'text-status-error',
        bg: 'bg-status-error',
      };
    case 'warning':
      return {
        text: 'text-status-warning',
        bg: 'bg-status-warning',
      };
    case 'ok':
      return {
        text: 'text-status-success',
        bg: 'bg-status-success',
      };
  }
}

/**
 * Exception aggregation hook
 * Collects critical/warning/ok alerts from attendance, sessions, erg data, NCAA compliance
 * Fetches from /api/v1/dashboard/exceptions/:teamId
 */
export function useExceptions(teamId: string): UseExceptionsReturn {
  const { isAuthenticated, isInitialized } = useAuth();

  // Query for exceptions with 2-minute stale time (active data)
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.exceptions(teamId),
    queryFn: async () => {
      const response = await api.get(`/dashboard/exceptions/${teamId}`);
      return response.data as ExceptionSummary;
    },
    enabled: isAuthenticated && isInitialized && !!teamId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Organize exceptions by widget ID
  const widgetExceptions = useMemo(() => {
    if (!data?.items) return {};

    const byWidget: Record<string, ExceptionItem[]> = {};

    data.items.forEach((item) => {
      if (item.widgetId) {
        if (!byWidget[item.widgetId]) {
          byWidget[item.widgetId] = [];
        }
        byWidget[item.widgetId].push(item);
      }
    });

    return byWidget;
  }, [data]);

  // Default summary while loading or no data
  // Ensure items is always an array — API may omit it
  const summary: ExceptionSummary = {
    critical: data?.critical ?? 0,
    warning: data?.warning ?? 0,
    ok: data?.ok ?? 0,
    items: data?.items ?? [],
  };

  return {
    summary,
    isLoading,
    widgetExceptions,
  };
}
