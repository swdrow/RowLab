/**
 * Global Search types for Command Palette
 *
 * Supports searching across all entity types (athletes, sessions, erg tests,
 * lineups, regattas, races, seat races) with fuzzy matching via Fuse.js.
 */

import type { Icon } from '@phosphor-icons/react';

// ============================================
// SEARCH RESULT TYPES
// ============================================

/**
 * Entity types that can be searched
 */
export type SearchResultType =
  | 'athlete'
  | 'session'
  | 'erg_test'
  | 'lineup'
  | 'regatta'
  | 'race'
  | 'seat_race';

/**
 * Single search result item
 */
export interface SearchResult {
  /** Unique identifier for the entity */
  id: string;
  /** Entity type for grouping and routing */
  type: SearchResultType;
  /** Primary display text (e.g., athlete name, session title) */
  title: string;
  /** Secondary display text (e.g., side preference, date) */
  subtitle?: string;
  /** Navigation path for react-router */
  href: string;
  /** Optional icon override (defaults to type-based icon) */
  icon?: Icon;
  /** Additional metadata for search weighting */
  metadata?: {
    /** Date for recency-based sorting */
    date?: string;
    /** Keywords for search matching */
    keywords?: string[];
  };
}

/**
 * Group of search results by type
 */
export interface SearchGroup {
  /** Entity type for this group */
  type: SearchResultType;
  /** Human-readable label (e.g., "Athletes", "Sessions") */
  label: string;
  /** Results in this group */
  results: SearchResult[];
}

// ============================================
// SEARCH STATE
// ============================================

/**
 * Global search state
 */
export interface SearchState {
  /** Current search query */
  query: string;
  /** Whether search is in progress */
  isLoading: boolean;
  /** Grouped search results */
  results: SearchGroup[];
  /** Recently accessed items (max 5) */
  recentItems: SearchResult[];
  /** Whether the command palette is open */
  isOpen: boolean;
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Human-readable labels for search result types
 */
export const SEARCH_TYPE_LABELS: Record<SearchResultType, string> = {
  athlete: 'Athletes',
  session: 'Sessions',
  erg_test: 'Erg Tests',
  lineup: 'Lineups',
  regatta: 'Regattas',
  race: 'Races',
  seat_race: 'Seat Races',
};

/**
 * Icon names for search result types (Phosphor icon names)
 * Used to render type-specific icons in search results
 */
export const SEARCH_TYPE_ICONS: Record<SearchResultType, string> = {
  athlete: 'User',
  session: 'Calendar',
  erg_test: 'Barbell',
  lineup: 'Rows',
  regatta: 'Trophy',
  race: 'Flag',
  seat_race: 'ArrowsLeftRight',
};

/**
 * Order for displaying search result groups
 */
export const SEARCH_TYPE_ORDER: SearchResultType[] = [
  'athlete',
  'session',
  'erg_test',
  'lineup',
  'regatta',
  'race',
  'seat_race',
];

// ============================================
// LOCAL STORAGE KEYS
// ============================================

/**
 * Local storage key for recent search items
 */
export const RECENT_ITEMS_STORAGE_KEY = 'rowlab:recent-search-items';

/**
 * Maximum number of recent items to store
 */
export const MAX_RECENT_ITEMS = 5;

// ============================================
// FUSE.JS OPTIONS
// ============================================

/**
 * Fuse.js options for fuzzy search
 */
export const FUSE_OPTIONS = {
  /** Include score in results for ranking */
  includeScore: true,
  /** Search threshold (0.0 = exact match, 1.0 = match anything) */
  threshold: 0.4,
  /** Minimum character length before search starts */
  minMatchCharLength: 2,
  /** Keys to search on */
  keys: [
    { name: 'title', weight: 2 },
    { name: 'subtitle', weight: 1 },
    { name: 'metadata.keywords', weight: 1.5 },
  ],
  /** Use extended search patterns */
  useExtendedSearch: false,
  /** Ignore location in matching */
  ignoreLocation: true,
};
