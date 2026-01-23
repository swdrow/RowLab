import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface AnalyticsEvent {
  type: 'route_view';
  version: 'v1' | 'v2';
  path: string;
  timestamp: string;
}

interface UsageStats {
  v1Count: number;
  v2Count: number;
  total: number;
  v2Percentage: number;
}

const STORAGE_KEY = 'rowlab_analytics';
const MAX_EVENTS = 100;

/**
 * Hook to track route views with version tagging.
 * Call this in layout components to track page views.
 */
export function useRouteAnalytics(version: 'v1' | 'v2') {
  const location = useLocation();

  useEffect(() => {
    const event: AnalyticsEvent = {
      type: 'route_view',
      version,
      path: location.pathname,
      timestamp: new Date().toISOString(),
    };

    // Retrieve existing events
    const existing: AnalyticsEvent[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    );

    // Add new event
    existing.push(event);

    // Keep only last MAX_EVENTS
    while (existing.length > MAX_EVENTS) {
      existing.shift();
    }

    // Persist
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  }, [location.pathname, version]);
}

/**
 * Retrieve version usage statistics from stored analytics.
 */
export function getVersionUsageStats(): UsageStats {
  const events: AnalyticsEvent[] = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || '[]'
  );

  const v1Count = events.filter((e) => e.version === 'v1').length;
  const v2Count = events.filter((e) => e.version === 'v2').length;
  const total = events.length;
  const v2Percentage = total > 0 ? Math.round((v2Count / total) * 100) : 0;

  return { v1Count, v2Count, total, v2Percentage };
}

/**
 * Clear all stored analytics events.
 */
export function clearAnalytics(): void {
  localStorage.removeItem(STORAGE_KEY);
}
