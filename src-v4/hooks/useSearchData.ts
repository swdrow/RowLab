/**
 * Multi-entity search hooks for the Cmd+K command palette.
 *
 * - useSearchWorkouts: client-side fuse.js on cached recent workouts
 * - useSearchAthletes: server-side search via /api/v1/athletes/search
 * - useSearchTeams: server-side search via /api/v1/teams/search
 * - useSearchSessions: client-side fuse.js on cached recent sessions
 * - useSearchPages: client-side fuse.js on static page entries
 */
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Fuse from 'fuse.js';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { SearchEntry } from '@/components/search/searchRegistry';

/* ------------------------------------------------------------------ */
/* Debounce hook                                                       */
/* ------------------------------------------------------------------ */

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface SearchAthlete {
  id: string;
  name: string;
  email?: string;
}

export interface SearchWorkoutResult {
  id: string;
  type: string | null;
  machineType: string | null;
  distanceM: number | null;
  durationSeconds: number | null;
  avgPace: number | null;
  avgWatts: number | null;
  strokeRate: number | null;
  avgHeartRate?: number | null;
  date: string;
  notes: string | null;
  source: string;
  composedTitle: string;
  dateStr: string;
}

export interface SearchTeamResult {
  id: string;
  name: string;
  identifier: string;
  memberCount?: number;
}

export interface SearchSessionResult {
  id: string;
  name: string;
  type: string;
  status: string;
  date: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function composeWorkoutTitle(w: {
  distanceM: number | null;
  durationSeconds: number | null;
  machineType: string | null;
}): string {
  const machine = w.machineType ?? 'Workout';
  if (w.distanceM && w.distanceM > 0) {
    return `${w.distanceM}m ${machine}`;
  }
  if (w.durationSeconds && w.durationSeconds > 0) {
    return `${formatDuration(w.durationSeconds)} ${machine}`;
  }
  return machine;
}

/* ------------------------------------------------------------------ */
/* useSearchWorkouts — client-side fuse.js on cached recent workouts   */
/* ------------------------------------------------------------------ */

interface RawWorkout {
  id: string;
  type: string | null;
  machineType: string | null;
  distanceM: number | null;
  durationSeconds: number | null;
  avgPace: number | null;
  avgWatts: number | null;
  strokeRate: number | null;
  avgHeartRate?: number | null;
  date: string;
  notes: string | null;
  source: string;
}

export function useSearchWorkouts(query: string) {
  // Fetch recent workouts once (cached for 5 min)
  const { data: rawWorkouts, isLoading } = useQuery({
    queryKey: ['search', 'workouts', 'recent'],
    queryFn: async (): Promise<RawWorkout[]> => {
      const res = await api.get('/api/u/workouts', {
        params: { limit: 50, sort: 'date', order: 'desc' },
      });
      const data = res.data?.data ?? res.data;
      const items = data?.items ?? (Array.isArray(data) ? data : []);
      return items;
    },
    staleTime: 5 * 60_000,
  });

  // Build searchable workout list with composed titles
  const searchableWorkouts = useMemo(() => {
    if (!rawWorkouts) return [];
    return rawWorkouts.map(
      (w): SearchWorkoutResult => ({
        ...w,
        composedTitle: composeWorkoutTitle(w),
        dateStr: formatDate(w.date),
      })
    );
  }, [rawWorkouts]);

  // Fuse.js instance
  const fuse = useMemo(() => {
    return new Fuse(searchableWorkouts, {
      keys: [
        { name: 'composedTitle', weight: 2 },
        { name: 'dateStr', weight: 1.5 },
        { name: 'notes', weight: 1 },
        { name: 'machineType', weight: 0.5 },
      ],
      threshold: 0.4,
    });
  }, [searchableWorkouts]);

  // Search results
  const results = useMemo(() => {
    if (query.length < 2) return [];
    return fuse.search(query, { limit: 3 }).map((r) => r.item);
  }, [fuse, query]);

  // Total count for "See all" link
  const totalCount = useMemo(() => {
    if (query.length < 2) return 0;
    return fuse.search(query).length;
  }, [fuse, query]);

  return { data: results, isLoading, totalCount };
}

/* ------------------------------------------------------------------ */
/* useSearchAthletes — server-side debounced search                    */
/* ------------------------------------------------------------------ */

export function useSearchAthletes(query: string) {
  const debouncedQuery = useDebouncedValue(query, 400);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.athletes.search(debouncedQuery),
    queryFn: async (): Promise<SearchAthlete[]> => {
      const res = await api.get('/api/v1/athletes/search', {
        params: { q: debouncedQuery },
      });
      const d = res.data?.data ?? res.data;
      return Array.isArray(d) ? d : [];
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 60_000,
  });

  return {
    data: (data ?? []).slice(0, 3),
    isLoading: debouncedQuery.length >= 2 && isLoading,
    totalCount: data?.length ?? 0,
  };
}

/* ------------------------------------------------------------------ */
/* useSearchTeams — server-side debounced search                       */
/* ------------------------------------------------------------------ */

export function useSearchTeams(query: string) {
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['search', 'teams', debouncedQuery],
    queryFn: async (): Promise<SearchTeamResult[]> => {
      const res = await api.get('/api/v1/teams/search', {
        params: { q: debouncedQuery },
      });
      const d = res.data?.data ?? res.data;
      return Array.isArray(d) ? d : [];
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 60_000,
  });

  return {
    data: (data ?? []).slice(0, 3),
    isLoading: debouncedQuery.length >= 2 && isLoading,
    totalCount: data?.length ?? 0,
  };
}

/* ------------------------------------------------------------------ */
/* useSearchSessions — client-side fuse.js on cached recent sessions   */
/* ------------------------------------------------------------------ */

export function useSearchSessions(query: string) {
  // Fetch recent sessions once (cached for 5 min)
  const { data: rawSessions, isLoading } = useQuery({
    queryKey: ['search', 'sessions', 'recent'],
    queryFn: async (): Promise<SearchSessionResult[]> => {
      try {
        const res = await api.get('/api/v1/sessions', {
          params: { limit: 20 },
        });
        const d = (res.data as { data?: { sessions?: SearchSessionResult[] } })?.data?.sessions;
        return d ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60_000,
  });

  // Fuse.js instance
  const fuse = useMemo(() => {
    return new Fuse(rawSessions ?? [], {
      keys: [{ name: 'name', weight: 1 }],
      threshold: 0.4,
    });
  }, [rawSessions]);

  // Search results
  const results = useMemo(() => {
    if (query.length < 2) return [];
    return fuse.search(query, { limit: 3 }).map((r) => r.item);
  }, [fuse, query]);

  const totalCount = useMemo(() => {
    if (query.length < 2) return 0;
    return fuse.search(query).length;
  }, [fuse, query]);

  return { data: results, isLoading, totalCount };
}

/* ------------------------------------------------------------------ */
/* useSearchPages — client-side fuse.js on static page entries         */
/* ------------------------------------------------------------------ */

export function useSearchPages(query: string, pages: SearchEntry[]) {
  const fuse = useMemo(() => {
    return new Fuse(pages, {
      keys: [
        { name: 'label', weight: 2 },
        { name: 'keywords', weight: 1 },
        { name: 'description', weight: 0.5 },
      ],
      threshold: 0.4,
    });
  }, [pages]);

  const results = useMemo(() => {
    if (query.length < 1) return pages; // Show all pages when no query
    return fuse.search(query, { limit: 3 }).map((r) => r.item);
  }, [fuse, query, pages]);

  const totalCount = useMemo(() => {
    if (query.length < 1) return pages.length;
    return fuse.search(query).length;
  }, [fuse, query, pages]);

  return { data: results, totalCount };
}
