/**
 * Global Search Hook
 *
 * Fetches all searchable entities, builds search index, and provides
 * fuzzy search functionality for the command palette.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAthletes } from '@v2/hooks/useAthletes';
import { useSessions } from '@v2/hooks/useSessions';
import { useErgTests } from '@v2/hooks/useErgTests';
import { useLineups } from '@v2/hooks/useLineups';
import { useRegattas } from '@v2/hooks/useRegattas';
import { useSeatRaceSessions } from '@v2/hooks/useSeatRaceSessions';
import type { SearchResult, SearchGroup } from '@v2/types/search';
import {
  buildSearchIndex,
  searchItems,
  groupSearchResults,
  getRecentItems,
  addRecentItem,
  clearRecentItems,
} from '../services/searchService';

// ============================================
// TYPES
// ============================================

export interface UseGlobalSearchReturn {
  /** Current search query */
  query: string;
  /** Set search query */
  setQuery: (query: string) => void;
  /** Whether any data is still loading */
  isLoading: boolean;
  /** Grouped search results */
  results: SearchGroup[];
  /** Total number of results */
  totalResults: number;
  /** Recently accessed items */
  recentItems: SearchResult[];
  /** Add item to recent items */
  addToRecent: (item: SearchResult) => void;
  /** Clear all recent items */
  clearRecent: () => void;
  /** Whether the command palette is open */
  isOpen: boolean;
  /** Open the command palette */
  open: () => void;
  /** Close the command palette */
  close: () => void;
  /** Toggle the command palette */
  toggle: () => void;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook for global search across all entity types
 */
export function useGlobalSearch(): UseGlobalSearchReturn {
  // State
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [recentItems, setRecentItems] = useState<SearchResult[]>([]);

  // Load recent items on mount
  useEffect(() => {
    setRecentItems(getRecentItems());
  }, []);

  // Fetch all searchable entities in parallel
  const { allAthletes, isLoading: athletesLoading } = useAthletes();
  const { sessions, isLoading: sessionsLoading } = useSessions();
  const { tests: ergTests, isLoading: ergTestsLoading } = useErgTests();
  const { lineups, isLoading: lineupsLoading } = useLineups();
  const { data: regattas, isLoading: regattasLoading } = useRegattas();
  const { sessions: seatRaces, isLoading: seatRacesLoading } = useSeatRaceSessions();

  // Combine loading states
  const isLoading =
    athletesLoading ||
    sessionsLoading ||
    ergTestsLoading ||
    lineupsLoading ||
    regattasLoading ||
    seatRacesLoading;

  // Extract races from regattas
  const races = useMemo(() => {
    if (!regattas) return [];
    return regattas.flatMap((regatta) => regatta.races || []);
  }, [regattas]);

  // Build search index from all entities
  const searchIndex = useMemo(() => {
    return buildSearchIndex({
      athletes: allAthletes,
      sessions,
      ergTests,
      lineups,
      regattas: regattas || [],
      races,
      seatRaces,
    });
  }, [allAthletes, sessions, ergTests, lineups, regattas, races, seatRaces]);

  // Search and group results
  const { results, totalResults } = useMemo(() => {
    if (!query.trim()) {
      return { results: [], totalResults: 0 };
    }

    const searchResults = searchItems(searchIndex, query);
    const grouped = groupSearchResults(searchResults);
    const total = searchResults.length;

    return { results: grouped, totalResults: total };
  }, [searchIndex, query]);

  // Callbacks
  const addToRecent = useCallback((item: SearchResult) => {
    addRecentItem(item);
    setRecentItems(getRecentItems());
  }, []);

  const clearRecent = useCallback(() => {
    clearRecentItems();
    setRecentItems([]);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery('');
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) {
        setQuery('');
      }
      return !prev;
    });
  }, []);

  return {
    query,
    setQuery,
    isLoading,
    results,
    totalResults,
    recentItems,
    addToRecent,
    clearRecent,
    isOpen,
    open,
    close,
    toggle,
  };
}
