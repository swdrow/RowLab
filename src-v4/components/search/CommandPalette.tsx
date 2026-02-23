/**
 * Cmd+K command palette: global search and command execution.
 *
 * - Cmd+K (Mac) / Ctrl+K (Windows) opens the palette
 * - oarbit:open-search custom event opens the palette (from TopBar button)
 * - Escape or click outside closes
 * - ">" prefix switches to command mode
 * - Arrow keys navigate, Enter selects
 * - Results: Pages, Commands, Athletes (debounced API search)
 * - Empty state: recent pages + suggested actions
 *
 * Uses cmdk library for keyboard navigation and filtering.
 * Uses motion/react for open/close animation.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/features/auth/useAuth';
import { getSearchRegistry, type SearchEntry } from './searchRegistry';
import { SearchResults, SearchEmptyState } from './SearchResults';
import { SPRING_SNAPPY } from '@/lib/animations';

/* === RECENTS (localStorage) === */

const RECENTS_KEY = 'oarbit:recent-pages';
const MAX_RECENTS = 5;

interface RecentPage {
  label: string;
  path: string;
}

function getRecents(): RecentPage[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addRecent(label: string, path: string): void {
  const recents = getRecents().filter((r) => r.path !== path);
  recents.unshift({ label, path });
  localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, MAX_RECENTS)));
}

/* === DEBOUNCE HOOK === */

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

/* === ATHLETE SEARCH HOOK === */

interface Athlete {
  id: string;
  name: string;
  email?: string;
}

function useAthleteSearch(query: string) {
  const debouncedQuery = useDebouncedValue(query, 400);

  return useQuery({
    queryKey: queryKeys.athletes.search(debouncedQuery),
    queryFn: async (): Promise<Athlete[]> => {
      const res = await api.get('/api/v1/athletes/search', {
        params: { q: debouncedQuery },
      });
      // Handle both { data: [...] } and direct array response
      const data = res.data?.data ?? res.data;
      return Array.isArray(data) ? data : [];
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 60_000,
  });
}

/* === COMMAND PALETTE COMPONENT === */

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Determine mode: command mode if starts with ">"
  const isCommandMode = search.startsWith('>');
  const searchQuery = isCommandMode ? search.slice(1).trim() : search;

  // Build registry with actions
  const registry = useMemo(() => {
    return getSearchRegistry(
      (path: string) => {
        navigate({ to: path });
      },
      {
        switchTeam: () => {
          // Open team switcher -- dispatch event for UserMenu to handle
          window.dispatchEvent(new CustomEvent('oarbit:open-team-switcher'));
        },
        logout: () => {
          logout();
        },
      }
    );
  }, [navigate, logout]);

  // Split into pages and commands
  const pageEntries = useMemo(() => registry.filter((e) => e.type === 'page'), [registry]);
  const commandEntries = useMemo(() => registry.filter((e) => e.type === 'command'), [registry]);

  // Athlete search (only in non-command mode with 2+ chars)
  const athleteSearch = useAthleteSearch(isCommandMode ? '' : searchQuery);

  // Recents for empty state
  const [recents, setRecents] = useState<RecentPage[]>([]);

  // Listen for open events
  useEffect(() => {
    function handleOpenSearch() {
      setOpen(true);
    }

    window.addEventListener('oarbit:open-search', handleOpenSearch);
    return () => window.removeEventListener('oarbit:open-search', handleOpenSearch);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setRecents(getRecents());
      setSearch('');
      // Small delay to let animation start before focusing
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  // Close on Escape
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
    }
  }, []);

  // Handlers
  const handleSelectPage = useCallback(
    (path: string) => {
      const entry = pageEntries.find((e) => e.path === path);
      if (entry) addRecent(entry.label, path);
      navigate({ to: path });
      setOpen(false);
    },
    [navigate, pageEntries]
  );

  const handleSelectCommand = useCallback((entry: SearchEntry) => {
    entry.action?.();
    setOpen(false);
  }, []);

  const handleSelectAthlete = useCallback(
    (athlete: Athlete) => {
      const path = `/athletes/${athlete.id}`;
      addRecent(athlete.name, path);
      // Navigate to athlete detail -- route may not exist yet, cast to satisfy type checker
      navigate({ to: path as '/' });
      setOpen(false);
    },
    [navigate]
  );

  const handleSelectRecent = useCallback(
    (path: string) => {
      navigate({ to: path });
      setOpen(false);
    },
    [navigate]
  );

  const handleSelectSuggestion = useCallback(
    (path: string) => {
      navigate({ to: path });
      setOpen(false);
    },
    [navigate]
  );

  const isEmpty = search.length === 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={SPRING_SNAPPY}
            className="fixed inset-x-0 top-0 z-50 mx-auto mt-[18vh] max-w-xl px-4"
            onKeyDown={handleKeyDown}
          >
            <Command
              className="command-palette overflow-hidden rounded-2xl border border-edge-default bg-void-overlay shadow-2xl"
              shouldFilter={true}
              loop
            >
              {/* Search input */}
              <div className="flex items-center gap-2 border-b border-edge-default/50 px-4">
                <Search size={16} className="shrink-0 text-text-faint" />
                <Command.Input
                  ref={inputRef}
                  value={search}
                  onValueChange={setSearch}
                  placeholder={
                    isCommandMode ? 'Type a command...' : 'Search pages, commands, or athletes...'
                  }
                  className="h-12 w-full bg-transparent text-sm text-text-bright placeholder-text-faint outline-none"
                />
                {search.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-text-faint transition-colors hover:bg-void-overlay hover:text-text-bright"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Results */}
              <Command.List className="max-h-80 overflow-y-auto overscroll-contain px-2 py-2">
                <Command.Empty className="py-8 text-center text-sm text-text-faint">
                  No results found
                </Command.Empty>

                {isEmpty ? (
                  <SearchEmptyState
                    recents={recents}
                    onSelectRecent={handleSelectRecent}
                    onSelectSuggestion={handleSelectSuggestion}
                  />
                ) : isCommandMode ? (
                  <SearchResults
                    pages={[]}
                    commands={commandEntries}
                    athletes={[]}
                    athletesLoading={false}
                    athleteQuery=""
                    onSelectPage={handleSelectPage}
                    onSelectCommand={handleSelectCommand}
                    onSelectAthlete={handleSelectAthlete}
                  />
                ) : (
                  <SearchResults
                    pages={pageEntries}
                    commands={commandEntries}
                    athletes={athleteSearch.data ?? []}
                    athletesLoading={athleteSearch.isLoading}
                    athleteQuery={searchQuery}
                    onSelectPage={handleSelectPage}
                    onSelectCommand={handleSelectCommand}
                    onSelectAthlete={handleSelectAthlete}
                  />
                )}
              </Command.List>

              {/* Footer hints */}
              <div className="flex items-center gap-4 border-t border-edge-default/50 px-4 py-2 text-[11px] text-text-faint">
                <span>
                  <kbd className="rounded bg-void-raised px-1 py-0.5 text-[10px] font-medium">
                    {'\u2191\u2193'}
                  </kbd>{' '}
                  navigate
                </span>
                <span>
                  <kbd className="rounded bg-void-raised px-1 py-0.5 text-[10px] font-medium">
                    {'\u21B5'}
                  </kbd>{' '}
                  select
                </span>
                <span>
                  <kbd className="rounded bg-void-raised px-1 py-0.5 text-[10px] font-medium">
                    esc
                  </kbd>{' '}
                  close
                </span>
                <span className="ml-auto">
                  Type{' '}
                  <kbd className="rounded bg-void-raised px-1 py-0.5 text-[10px] font-medium">
                    &gt;
                  </kbd>{' '}
                  for commands
                </span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
