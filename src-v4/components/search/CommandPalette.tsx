/**
 * Cmd+K command palette: global search and command execution.
 *
 * - Cmd+K (Mac) / Ctrl+K (Windows) opens the palette
 * - oarbit:open-search custom event opens the palette (from TopBar button)
 * - Escape or click outside closes
 * - ">" prefix switches to command mode
 * - Arrow keys navigate, Enter selects
 * - Results: Workouts, Athletes, Teams, Sessions, Pages, Actions (grouped)
 * - Desktop: two-panel layout with preview pane
 * - Empty state: recent pages + quick actions
 * - All filtering handled by fuse.js / backend APIs (shouldFilter=false)
 *
 * Uses cmdk library for keyboard navigation.
 * Uses motion/react for open/close animation.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'motion/react';
import { IconSearch } from '@/components/icons';
import { useAuth } from '@/features/auth/useAuth';
import { useIsDesktop } from '@/hooks/useBreakpoint';
import {
  useSearchWorkouts,
  useSearchAthletes,
  useSearchTeams,
  useSearchSessions,
  useSearchPages,
} from '@/hooks/useSearchData';
import { getSearchRegistry, getPageEntries, type SearchEntry } from './searchRegistry';
import { SearchResults, SearchEmptyState } from './SearchResults';
import { SearchPreview, type PreviewItem } from './SearchPreview';
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

/* === COMMAND PALETTE COMPONENT === */

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [previewItem, setPreviewItem] = useState<PreviewItem>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const isDesktop = useIsDesktop();

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
        logWorkout: () => {
          window.dispatchEvent(new CustomEvent('oarbit:open-log-workout'));
        },
        switchTeam: () => {
          window.dispatchEvent(new CustomEvent('oarbit:open-team-switcher'));
        },
        logout: () => {
          logout();
        },
      }
    );
  }, [navigate, logout]);

  // Split into pages and commands
  const allPageEntries = useMemo(() => getPageEntries(), []);
  const commandEntries = useMemo(() => registry.filter((e) => e.type === 'command'), [registry]);

  // Search hooks -- all run in parallel, only when not in command mode
  const activeQuery = isCommandMode ? '' : searchQuery;
  const workoutSearch = useSearchWorkouts(activeQuery);
  const athleteSearch = useSearchAthletes(activeQuery);
  const teamSearch = useSearchTeams(activeQuery);
  const sessionSearch = useSearchSessions(activeQuery);
  const pageSearch = useSearchPages(activeQuery, allPageEntries);

  // Filter commands client-side too
  const filteredCommands = useMemo(() => {
    if (searchQuery.length < 1) return commandEntries;
    const q = searchQuery.toLowerCase();
    return commandEntries.filter(
      (e) =>
        e.label.toLowerCase().includes(q) || e.keywords.some((kw) => kw.toLowerCase().includes(q))
    );
  }, [commandEntries, searchQuery]);

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
      setPreviewItem(null);
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
      const entry = allPageEntries.find((e) => e.path === path);
      if (entry) addRecent(entry.label, path);
      navigate({ to: path });
      setOpen(false);
    },
    [navigate, allPageEntries]
  );

  const handleSelectCommand = useCallback((entry: SearchEntry) => {
    entry.action?.();
    setOpen(false);
  }, []);

  const handleSelectAthlete = useCallback(
    (athlete: { id: string; name: string }) => {
      const path = `/athletes/${athlete.id}`;
      addRecent(athlete.name, path);
      navigate({ to: path as '/' });
      setOpen(false);
    },
    [navigate]
  );

  const handleSelectWorkout = useCallback(
    (workout: { id: string; composedTitle: string }) => {
      const path = `/workouts/${workout.id}`;
      addRecent(workout.composedTitle, path);
      navigate({ to: path as '/' });
      setOpen(false);
    },
    [navigate]
  );

  const handleSelectTeam = useCallback(
    (team: { identifier: string; name: string }) => {
      const path = `/team/${team.identifier}/dashboard`;
      addRecent(team.name, path);
      navigate({ to: path as '/' });
      setOpen(false);
    },
    [navigate]
  );

  const handleSelectSession = useCallback(
    (session: { id: string; name: string }) => {
      const path = `/training/sessions/${session.id}`;
      addRecent(session.name, path);
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

  const handleNavigate = useCallback(
    (path: string) => {
      navigate({ to: path as '/' });
      setOpen(false);
    },
    [navigate]
  );

  const handleLogWorkout = useCallback(() => {
    window.dispatchEvent(new CustomEvent('oarbit:open-log-workout'));
    setOpen(false);
  }, []);

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
            className={`fixed inset-x-0 top-0 z-50 mx-auto mt-[18vh] px-4 ${
              isDesktop ? 'max-w-3xl' : 'max-w-xl'
            }`}
            onKeyDown={handleKeyDown}
          >
            <Command
              className="command-palette overflow-hidden rounded-2xl border border-edge-default bg-void-overlay shadow-2xl"
              shouldFilter={false}
              loop
            >
              {/* Search input */}
              <div className="flex items-center gap-2 border-b border-edge-default/50 px-4">
                <IconSearch width={16} height={16} className="shrink-0 text-text-faint" />
                <Command.Input
                  ref={inputRef}
                  value={search}
                  onValueChange={setSearch}
                  placeholder={
                    isCommandMode ? 'Type a command...' : 'Search workouts, athletes, teams...'
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

              {/* Two-panel layout: results + preview */}
              <div className={`flex ${isDesktop ? 'min-h-[320px]' : ''}`}>
                {/* Left panel: results */}
                <Command.List
                  className={`max-h-80 overflow-y-auto overscroll-contain px-2 py-2 ${
                    isDesktop ? 'w-[55%] border-r border-edge-default/50' : 'w-full'
                  }`}
                >
                  {isEmpty ? (
                    <SearchEmptyState
                      recents={recents}
                      onSelectRecent={handleSelectRecent}
                      onSelectSuggestion={handleSelectSuggestion}
                      onLogWorkout={handleLogWorkout}
                    />
                  ) : isCommandMode ? (
                    <SearchResults
                      query={searchQuery}
                      workouts={[]}
                      workoutsLoading={false}
                      workoutsTotalCount={0}
                      athletes={[]}
                      athletesLoading={false}
                      athletesTotalCount={0}
                      teams={[]}
                      teamsLoading={false}
                      teamsTotalCount={0}
                      sessions={[]}
                      sessionsLoading={false}
                      sessionsTotalCount={0}
                      pages={[]}
                      commands={filteredCommands}
                      onSelectWorkout={handleSelectWorkout}
                      onSelectAthlete={handleSelectAthlete}
                      onSelectTeam={handleSelectTeam}
                      onSelectSession={handleSelectSession}
                      onSelectPage={handleSelectPage}
                      onSelectCommand={handleSelectCommand}
                      onHighlight={setPreviewItem}
                      onNavigate={handleNavigate}
                    />
                  ) : (
                    <SearchResults
                      query={searchQuery}
                      workouts={workoutSearch.data}
                      workoutsLoading={workoutSearch.isLoading}
                      workoutsTotalCount={workoutSearch.totalCount}
                      athletes={athleteSearch.data}
                      athletesLoading={athleteSearch.isLoading}
                      athletesTotalCount={athleteSearch.totalCount}
                      teams={teamSearch.data}
                      teamsLoading={teamSearch.isLoading}
                      teamsTotalCount={teamSearch.totalCount}
                      sessions={sessionSearch.data}
                      sessionsLoading={sessionSearch.isLoading}
                      sessionsTotalCount={sessionSearch.totalCount}
                      pages={pageSearch.data}
                      commands={filteredCommands}
                      onSelectWorkout={handleSelectWorkout}
                      onSelectAthlete={handleSelectAthlete}
                      onSelectTeam={handleSelectTeam}
                      onSelectSession={handleSelectSession}
                      onSelectPage={handleSelectPage}
                      onSelectCommand={handleSelectCommand}
                      onHighlight={setPreviewItem}
                      onNavigate={handleNavigate}
                    />
                  )}
                </Command.List>

                {/* Right panel: preview (desktop only) */}
                {isDesktop && (
                  <div className="w-[45%] bg-void-surface">
                    <SearchPreview item={previewItem} />
                  </div>
                )}
              </div>

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
