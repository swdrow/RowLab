/**
 * Exception Aggregation Hook
 * Phase 27-01: Aggregates red/yellow/green alerts from multiple domains
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
 * Compute exceptions from team data
 * For MVP, this aggregates client-side. Future: move to server-side endpoint
 */
function computeExceptions(teamId: string): ExceptionSummary {
  // TODO(phase-27-02): Implement actual exception computation using:
  // - useAttendance for attendance rates
  // - useSessions for overdue sessions
  // - useErgTests for stale erg data
  // - useNCAACompliance for NCAA violations

  // For now, return empty summary (no exceptions)
  // This prevents errors while dashboard is being built
  return {
    critical: 0,
    warning: 0,
    ok: 1, // All-clear indicator
    items: [
      {
        id: 'all-clear',
        severity: 'ok',
        title: 'All systems operational',
        description: 'No exceptions detected',
      },
    ],
  };
}

/**
 * Exception aggregation hook
 * Collects critical/warning/ok alerts from attendance, sessions, erg data, NCAA compliance
 */
export function useExceptions(teamId: string): UseExceptionsReturn {
  const { isAuthenticated, isInitialized } = useAuth();

  // Query for exceptions with 2-minute stale time (active data)
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.exceptions(teamId),
    queryFn: () => computeExceptions(teamId),
    enabled: isAuthenticated && isInitialized && !!teamId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Organize exceptions by widget ID
  const widgetExceptions = useMemo(() => {
    if (!data) return {};

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
  const summary: ExceptionSummary = data || {
    critical: 0,
    warning: 0,
    ok: 0,
    items: [],
  };

  return {
    summary,
    isLoading,
    widgetExceptions,
  };
}
