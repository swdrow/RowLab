/**
 * Lineup Search Hook - Phase 18 LINEUP-02
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import type { LineupSearchFilters, LineupSearchResult } from '../types/equipment';

// Query key factory
export const lineupSearchKeys = {
  all: ['lineup-search'] as const,
  search: (filters: LineupSearchFilters) => [...lineupSearchKeys.all, filters] as const,
};

interface SearchResult {
  lineups: LineupSearchResult[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Search historical lineups with multi-criteria filtering
 */
export function useLineupSearch(filters: LineupSearchFilters, enabled = true) {
  const { authenticatedFetch, isAuthenticated, isInitialized, activeTeamId } =
    useAuthStore();

  return useQuery({
    queryKey: lineupSearchKeys.search(filters),
    queryFn: async (): Promise<SearchResult> => {
      const params = new URLSearchParams();

      if (filters.athleteIds?.length) {
        params.append('athleteIds', filters.athleteIds.join(','));
      }
      if (filters.minAthletes && filters.minAthletes > 1) {
        params.append('minAthletes', String(filters.minAthletes));
      }
      if (filters.boatClasses?.length) {
        params.append('boatClasses', filters.boatClasses.join(','));
      }
      if (filters.shellNames?.length) {
        params.append('shellNames', filters.shellNames.join(','));
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }
      if (filters.nameSearch) {
        params.append('nameSearch', filters.nameSearch);
      }
      if (filters.sortBy) {
        params.append('sortBy', filters.sortBy);
      }
      if (filters.sortDirection) {
        params.append('sortDirection', filters.sortDirection);
      }

      const response = await authenticatedFetch(`/api/v1/lineups/search?${params.toString()}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error?.message || 'Search failed');
      return data.data;
    },
    enabled: isAuthenticated && isInitialized && !!activeTeamId && enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: keepPreviousData, // Keep previous results while fetching new
  });
}

/**
 * Build search filters from URL params (for deep linking)
 */
export function parseSearchFiltersFromUrl(searchParams: URLSearchParams): LineupSearchFilters {
  const athleteIds = searchParams.get('athleteIds');
  const minAthletes = searchParams.get('minAthletes');
  const boatClasses = searchParams.get('boatClasses');
  const shellNames = searchParams.get('shellNames');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const nameSearch = searchParams.get('nameSearch');
  const sortBy = searchParams.get('sortBy') as LineupSearchFilters['sortBy'];
  const sortDirection = searchParams.get('sortDirection') as LineupSearchFilters['sortDirection'];

  return {
    athleteIds: athleteIds ? athleteIds.split(',') : undefined,
    minAthletes: minAthletes ? parseInt(minAthletes, 10) : undefined,
    boatClasses: boatClasses ? boatClasses.split(',') : undefined,
    shellNames: shellNames ? shellNames.split(',') : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    nameSearch: nameSearch || undefined,
    sortBy: sortBy || undefined,
    sortDirection: sortDirection || undefined,
  };
}

/**
 * Build URL params from search filters (for sharing/bookmarking)
 */
export function buildSearchParamsFromFilters(filters: LineupSearchFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.athleteIds?.length) {
    params.set('athleteIds', filters.athleteIds.join(','));
  }
  if (filters.minAthletes && filters.minAthletes > 1) {
    params.set('minAthletes', String(filters.minAthletes));
  }
  if (filters.boatClasses?.length) {
    params.set('boatClasses', filters.boatClasses.join(','));
  }
  if (filters.shellNames?.length) {
    params.set('shellNames', filters.shellNames.join(','));
  }
  if (filters.startDate) {
    params.set('startDate', filters.startDate);
  }
  if (filters.endDate) {
    params.set('endDate', filters.endDate);
  }
  if (filters.nameSearch) {
    params.set('nameSearch', filters.nameSearch);
  }
  if (filters.sortBy) {
    params.set('sortBy', filters.sortBy);
  }
  if (filters.sortDirection) {
    params.set('sortDirection', filters.sortDirection);
  }

  return params;
}
