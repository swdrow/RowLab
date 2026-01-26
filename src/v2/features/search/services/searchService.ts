/**
 * Global Search Service
 *
 * Builds search index from entities and provides fuzzy search via Fuse.js.
 * Manages recent items in localStorage.
 */

import Fuse from 'fuse.js';
import type {
  SearchResult,
  SearchResultType,
  SearchGroup,
} from '@v2/types/search';
import {
  SEARCH_TYPE_LABELS,
  SEARCH_TYPE_ORDER,
  RECENT_ITEMS_STORAGE_KEY,
  MAX_RECENT_ITEMS,
} from '@v2/types/search';
import type { Athlete } from '@v2/types/athletes';
import type { Session } from '@v2/types/session';
import type { ErgTest } from '@v2/types/ergTests';
import type { Regatta, Race } from '@v2/types/regatta';
import type { SeatRaceSession } from '@v2/types/seatRacing';
import type { Lineup } from '@v2/hooks/useLineups';

// ============================================
// INDEX BUILDERS
// ============================================

/**
 * Convert athletes to search results
 */
export function athletesToSearchResults(athletes: Athlete[]): SearchResult[] {
  return athletes.map((athlete) => ({
    id: athlete.id,
    type: 'athlete' as SearchResultType,
    title: `${athlete.firstName} ${athlete.lastName}`,
    subtitle: [
      athlete.side,
      athlete.canCox && 'Cox',
      athlete.canScull && 'Sculler',
    ]
      .filter(Boolean)
      .join(' | ') || undefined,
    href: `/app/roster/${athlete.id}`,
    metadata: {
      keywords: [
        athlete.email || '',
        athlete.side || '',
      ].filter(Boolean),
    },
  }));
}

/**
 * Convert sessions to search results
 */
export function sessionsToSearchResults(sessions: Session[]): SearchResult[] {
  return sessions.map((session) => ({
    id: session.id,
    type: 'session' as SearchResultType,
    title: session.name,
    subtitle: `${session.type} | ${formatDate(session.date)}`,
    href: `/app/training/sessions/${session.id}`,
    metadata: {
      date: session.date,
      keywords: [session.type, session.status],
    },
  }));
}

/**
 * Convert erg tests to search results
 */
export function ergTestsToSearchResults(ergTests: ErgTest[]): SearchResult[] {
  return ergTests.map((test) => ({
    id: test.id,
    type: 'erg_test' as SearchResultType,
    title: test.athlete
      ? `${test.athlete.firstName} ${test.athlete.lastName} - ${test.testType.toUpperCase()}`
      : `${test.testType.toUpperCase()} Test`,
    subtitle: `${formatTime(test.timeSeconds)} | ${formatDate(test.testDate)}`,
    href: `/app/erg-data/${test.id}`,
    metadata: {
      date: test.testDate,
      keywords: [test.testType, test.athlete?.firstName || '', test.athlete?.lastName || ''],
    },
  }));
}

/**
 * Convert lineups to search results
 */
export function lineupsToSearchResults(lineups: Lineup[]): SearchResult[] {
  return lineups.map((lineup) => ({
    id: lineup.id,
    type: 'lineup' as SearchResultType,
    title: lineup.name,
    subtitle: lineup.assignments.length > 0
      ? `${lineup.assignments.length} assignments`
      : 'Empty lineup',
    href: `/app/lineups/${lineup.id}`,
    metadata: {
      date: lineup.updatedAt,
      keywords: [],
    },
  }));
}

/**
 * Convert regattas to search results
 */
export function regattasToSearchResults(regattas: Regatta[]): SearchResult[] {
  return regattas.map((regatta) => ({
    id: regatta.id,
    type: 'regatta' as SearchResultType,
    title: regatta.name,
    subtitle: [regatta.location, formatDate(regatta.date)]
      .filter(Boolean)
      .join(' | '),
    href: `/app/regattas/${regatta.id}`,
    metadata: {
      date: regatta.date,
      keywords: [regatta.location || '', regatta.host || ''],
    },
  }));
}

/**
 * Convert races to search results
 */
export function racesToSearchResults(races: Race[], regattas: Regatta[]): SearchResult[] {
  // Build regatta lookup map
  const regattaMap = new Map(regattas.map((r) => [r.id, r]));

  return races.map((race) => {
    const regatta = regattaMap.get(race.regattaId);
    return {
      id: race.id,
      type: 'race' as SearchResultType,
      title: race.eventName,
      subtitle: [race.boatClass, regatta?.name]
        .filter(Boolean)
        .join(' | '),
      href: `/app/regattas/${race.regattaId}/races/${race.id}`,
      metadata: {
        keywords: [race.boatClass, race.eventName],
      },
    };
  });
}

/**
 * Convert seat race sessions to search results
 */
export function seatRacesToSearchResults(sessions: SeatRaceSession[]): SearchResult[] {
  return sessions.map((session) => ({
    id: session.id,
    type: 'seat_race' as SearchResultType,
    title: `Seat Race - ${session.boatClass}`,
    subtitle: [session.location, formatDate(session.date)]
      .filter(Boolean)
      .join(' | '),
    href: `/app/seat-racing/${session.id}`,
    metadata: {
      date: session.date,
      keywords: [session.boatClass, session.location || '', session.conditions || ''],
    },
  }));
}

// ============================================
// SEARCH INDEX
// ============================================

/**
 * Build complete search index from all entities
 */
export function buildSearchIndex(data: {
  athletes?: Athlete[];
  sessions?: Session[];
  ergTests?: ErgTest[];
  lineups?: Lineup[];
  regattas?: Regatta[];
  races?: Race[];
  seatRaces?: SeatRaceSession[];
}): SearchResult[] {
  const results: SearchResult[] = [];

  if (data.athletes) {
    results.push(...athletesToSearchResults(data.athletes));
  }
  if (data.sessions) {
    results.push(...sessionsToSearchResults(data.sessions));
  }
  if (data.ergTests) {
    results.push(...ergTestsToSearchResults(data.ergTests));
  }
  if (data.lineups) {
    results.push(...lineupsToSearchResults(data.lineups));
  }
  if (data.regattas) {
    results.push(...regattasToSearchResults(data.regattas));
  }
  if (data.races && data.regattas) {
    results.push(...racesToSearchResults(data.races, data.regattas));
  }
  if (data.seatRaces) {
    results.push(...seatRacesToSearchResults(data.seatRaces));
  }

  return results;
}

// ============================================
// FUZZY SEARCH
// ============================================

/**
 * Fuse.js options for fuzzy search
 */
const fuseOptions = {
  includeScore: true,
  threshold: 0.4,
  minMatchCharLength: 2,
  keys: [
    { name: 'title', weight: 2 },
    { name: 'subtitle', weight: 1 },
    { name: 'metadata.keywords', weight: 1.5 },
  ],
  ignoreLocation: true,
};

/**
 * Search items using Fuse.js fuzzy matching
 */
export function searchItems(
  index: SearchResult[],
  query: string
): SearchResult[] {
  if (!query.trim()) {
    return [];
  }

  const fuse = new Fuse(index, fuseOptions);
  const results = fuse.search(query);

  // Return items sorted by score (lower is better)
  return results.map((r) => r.item);
}

/**
 * Group search results by type
 */
export function groupSearchResults(results: SearchResult[]): SearchGroup[] {
  const groups = new Map<SearchResultType, SearchResult[]>();

  // Initialize groups in display order
  SEARCH_TYPE_ORDER.forEach((type) => {
    groups.set(type, []);
  });

  // Distribute results into groups
  results.forEach((result) => {
    const group = groups.get(result.type);
    if (group) {
      group.push(result);
    }
  });

  // Convert to array, filtering out empty groups
  return SEARCH_TYPE_ORDER
    .filter((type) => (groups.get(type)?.length ?? 0) > 0)
    .map((type) => ({
      type,
      label: SEARCH_TYPE_LABELS[type],
      results: groups.get(type) || [],
    }));
}

// ============================================
// RECENT ITEMS
// ============================================

/**
 * Get recent items from localStorage
 */
export function getRecentItems(): SearchResult[] {
  try {
    const stored = localStorage.getItem(RECENT_ITEMS_STORAGE_KEY);
    if (!stored) return [];

    const items = JSON.parse(stored) as SearchResult[];
    return items.slice(0, MAX_RECENT_ITEMS);
  } catch {
    return [];
  }
}

/**
 * Add item to recent items in localStorage
 */
export function addRecentItem(item: SearchResult): void {
  try {
    const items = getRecentItems();

    // Remove duplicate if exists
    const filtered = items.filter(
      (i) => !(i.id === item.id && i.type === item.type)
    );

    // Add to front, limit to max
    const updated = [item, ...filtered].slice(0, MAX_RECENT_ITEMS);

    localStorage.setItem(RECENT_ITEMS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/**
 * Clear all recent items from localStorage
 */
export function clearRecentItems(): void {
  try {
    localStorage.removeItem(RECENT_ITEMS_STORAGE_KEY);
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format time (seconds) for display
 */
function formatTime(seconds: number): string {
  if (!seconds) return '--:--';

  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);

  return `${mins}:${secs.padStart(4, '0')}`;
}
