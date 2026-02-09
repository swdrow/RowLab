/**
 * Command Palette Component
 *
 * Global search interface triggered by Cmd/Ctrl+K.
 * Follows Raycast/Linear command palette pattern.
 *
 * Includes dedicated Athletes group with avatars and quick actions.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { AnimatePresence, motion } from 'framer-motion';
import {
  User,
  UserPlus,
  UploadSimple,
  Calendar,
  Barbell,
  Rows,
  Trophy,
  Flag,
  ArrowsLeftRight,
  MagnifyingGlass,
  Clock,
  X,
} from '@phosphor-icons/react';
import type { SearchResult, SearchResultType, SearchGroup } from '@v2/types/search';
import type { Athlete, SidePreference } from '@v2/types/athletes';
import { useGlobalSearch, useCommandPaletteStore } from '../hooks/useGlobalSearch';
import { useAthletes } from '@v2/hooks/useAthletes';
import { AthleteAvatar } from '@v2/components/athletes/AthleteAvatar';
import { ActionsGroup } from './ActionsGroup';
import { SuggestionsGroup } from './SuggestionsGroup';

// ============================================
// ICON MAP
// ============================================

const ICON_MAP: Record<SearchResultType, React.ElementType> = {
  athlete: User,
  session: Calendar,
  erg_test: Barbell,
  lineup: Rows,
  regatta: Trophy,
  race: Flag,
  seat_race: ArrowsLeftRight,
};

// ============================================
// RESULT ITEM
// ============================================

interface ResultItemProps {
  result: SearchResult;
  onSelect: (result: SearchResult) => void;
}

function ResultItem({ result, onSelect }: ResultItemProps) {
  const Icon = ICON_MAP[result.type];

  return (
    <Command.Item
      value={`${result.type}-${result.id}`}
      onSelect={() => onSelect(result)}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
                 data-[selected=true]:bg-surface-hover
                 hover:bg-surface-hover transition-colors"
    >
      <div
        className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-secondary/10
                      flex items-center justify-center"
      >
        <Icon size={18} weight="duotone" className="text-accent-secondary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-txt-primary truncate">{result.title}</p>
        {result.subtitle && <p className="text-xs text-txt-tertiary truncate">{result.subtitle}</p>}
      </div>
    </Command.Item>
  );
}

// ============================================
// RESULT GROUP
// ============================================

interface ResultGroupProps {
  group: SearchGroup;
  onSelect: (result: SearchResult) => void;
}

function ResultGroup({ group, onSelect }: ResultGroupProps) {
  return (
    <Command.Group heading={group.label}>
      {group.results.map((result) => (
        <ResultItem key={`${result.type}-${result.id}`} result={result} onSelect={onSelect} />
      ))}
    </Command.Group>
  );
}

// ============================================
// RECENT ITEMS
// ============================================

interface RecentItemsProps {
  items: SearchResult[];
  onSelect: (result: SearchResult) => void;
  onClear: () => void;
}

function RecentItems({ items, onSelect, onClear }: RecentItemsProps) {
  if (items.length === 0) return null;

  return (
    <Command.Group
      heading={
        <div className="flex items-center justify-between">
          <span>Recent</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="text-xs text-txt-tertiary hover:text-txt-secondary transition-colors"
          >
            Clear
          </button>
        </div>
      }
    >
      {items.map((item) => (
        <ResultItem key={`recent-${item.type}-${item.id}`} result={item} onSelect={onSelect} />
      ))}
    </Command.Group>
  );
}

// ============================================
// EMPTY STATE
// ============================================

interface EmptyStateProps {
  query: string;
  isLoading: boolean;
}

function EmptyState({ query, isLoading }: EmptyStateProps) {
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div
          className="inline-block w-5 h-5 border-2 border-accent-secondary/30
                        border-t-accent-secondary rounded-full animate-spin"
        />
        <p className="mt-2 text-sm text-txt-tertiary">Searching...</p>
      </div>
    );
  }

  if (query.trim()) {
    return (
      <Command.Empty className="py-8 text-center">
        <MagnifyingGlass size={32} className="mx-auto text-txt-tertiary mb-2" />
        <p className="text-sm text-txt-tertiary">No results found for "{query}"</p>
      </Command.Empty>
    );
  }

  return (
    <div className="py-8 text-center">
      <MagnifyingGlass size={32} className="mx-auto text-txt-tertiary mb-2" />
      <p className="text-sm text-txt-tertiary">Start typing to search...</p>
    </div>
  );
}

// ============================================
// SIDE BADGE COLORS
// ============================================

const SIDE_COLORS: Record<string, string> = {
  Port: 'bg-red-500',
  Starboard: 'bg-green-500',
  Both: 'bg-blue-500',
  Cox: 'bg-amber-500',
};

/** Small colored dot indicating athlete's rowing side */
function SideDot({ side }: { side: SidePreference }) {
  if (!side) return null;
  const color = SIDE_COLORS[side] || 'bg-txt-tertiary';
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} title={side} />;
}

/** Status text for non-active athletes */
function StatusBadge({ status }: { status: string }) {
  if (status === 'active') return null;
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-status-warning/10 text-status-warning font-medium">
      {label}
    </span>
  );
}

// ============================================
// ATHLETE COMMAND ITEM
// ============================================

interface AthleteCommandItemProps {
  athlete: Athlete;
  onSelect: (athlete: Athlete) => void;
}

/**
 * Enhanced command palette item for athletes.
 * Shows avatar, full name, side dot, and status badge.
 */
function AthleteCommandItem({ athlete, onSelect }: AthleteCommandItemProps) {
  const fullName = `${athlete.firstName} ${athlete.lastName}`;
  const keywords = [athlete.email, athlete.side, athlete.status].filter(Boolean).join(' ');

  return (
    <Command.Item
      value={fullName}
      keywords={[keywords]}
      onSelect={() => onSelect(athlete)}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
                 data-[selected=true]:bg-surface-hover
                 hover:bg-surface-hover transition-colors"
    >
      <AthleteAvatar
        firstName={athlete.firstName}
        lastName={athlete.lastName}
        photoUrl={athlete.avatar}
        size="sm"
        showHeadshot={false}
      />
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <p className="text-sm font-medium text-txt-primary truncate">{fullName}</p>
        <SideDot side={athlete.side} />
        <StatusBadge status={athlete.status} />
      </div>
    </Command.Item>
  );
}

// ============================================
// ATHLETES GROUP (for command palette)
// ============================================

/** Maximum athletes to show in command palette results */
const MAX_PALETTE_ATHLETES = 8;

interface AthletesGroupProps {
  athletes: Athlete[];
  onSelectAthlete: (athlete: Athlete) => void;
  onNavigate: (path: string) => void;
}

/**
 * Athletes group for the command palette.
 * Shows top matching athletes with avatars plus quick actions.
 * cmdk handles filtering based on the Command.Item `value` and `keywords`.
 */
function AthletesGroup({ athletes, onSelectAthlete, onNavigate }: AthletesGroupProps) {
  // Limit to top N athletes; cmdk's built-in search handles filtering
  const displayAthletes = athletes.slice(0, MAX_PALETTE_ATHLETES);

  return (
    <>
      {/* Athletes */}
      {displayAthletes.length > 0 && (
        <Command.Group heading="Athletes">
          {displayAthletes.map((athlete) => (
            <AthleteCommandItem key={athlete.id} athlete={athlete} onSelect={onSelectAthlete} />
          ))}
        </Command.Group>
      )}

      {/* Quick Actions */}
      <Command.Group heading="Quick Actions">
        <Command.Item
          value="Add New Athlete"
          keywords={['create', 'new', 'athlete', 'add']}
          onSelect={() => onNavigate('/app/athletes?action=create')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
                     data-[selected=true]:bg-surface-hover
                     hover:bg-surface-hover transition-colors"
        >
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-status-success/10
                          flex items-center justify-center"
          >
            <UserPlus size={18} weight="duotone" className="text-status-success" />
          </div>
          <p className="text-sm font-medium text-txt-primary">Add New Athlete</p>
        </Command.Item>
        <Command.Item
          value="Import Athletes CSV"
          keywords={['import', 'csv', 'bulk', 'upload', 'athletes']}
          onSelect={() => onNavigate('/app/athletes?action=import')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
                     data-[selected=true]:bg-surface-hover
                     hover:bg-surface-hover transition-colors"
        >
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-secondary/10
                          flex items-center justify-center"
          >
            <UploadSimple size={18} weight="duotone" className="text-accent-secondary" />
          </div>
          <p className="text-sm font-medium text-txt-primary">Import Athletes (CSV)</p>
        </Command.Item>
      </Command.Group>
    </>
  );
}

// ============================================
// COMMAND PALETTE
// ============================================

export function CommandPalette() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    query,
    setQuery,
    isLoading,
    results,
    totalResults,
    recentItems,
    addToRecent,
    clearRecent,
    isOpen,
    close,
    toggle,
  } = useGlobalSearch();

  // Fetch athletes for the dedicated Athletes group (uses stale cache, won't refetch on open)
  const { allAthletes } = useAthletes();

  // Handle Escape key to close (Cmd/Ctrl+K handled globally by useKeyboardShortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure animation has started
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle result selection
  const handleSelect = useCallback(
    (result: SearchResult) => {
      addToRecent(result);
      close();
      navigate(result.href);
    },
    [addToRecent, close, navigate]
  );

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        close();
      }
    },
    [close]
  );

  // Handle athlete selection from the dedicated Athletes group
  const handleSelectAthlete = useCallback(
    (athlete: Athlete) => {
      addToRecent({
        id: athlete.id,
        type: 'athlete',
        title: `${athlete.firstName} ${athlete.lastName}`,
        subtitle: athlete.side || undefined,
        href: `/app/athletes/${athlete.id}`,
      });
      close();
      navigate(`/app/athletes/${athlete.id}`);
    },
    [addToRecent, close, navigate]
  );

  // Handle quick action navigation
  const handleNavigate = useCallback(
    (path: string) => {
      close();
      navigate(path);
    },
    [close, navigate]
  );

  // Show recent items when no query
  const showRecent = !query.trim() && recentItems.length > 0;
  const showResults = query.trim() && results.length > 0;
  const showEmpty = query.trim() && results.length === 0;
  const showSuggestions = !query.trim();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]
                     bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="w-full max-w-xl mx-4"
          >
            <Command
              className="rounded-xl bg-card-bg border border-bdr-primary shadow-2xl overflow-hidden"
              loop
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-bdr-secondary">
                <MagnifyingGlass size={20} className="text-txt-tertiary flex-shrink-0" />
                <Command.Input
                  ref={inputRef}
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search athletes, sessions, erg tests..."
                  className="flex-1 bg-transparent text-txt-primary placeholder:text-txt-tertiary
                             outline-none text-sm"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="p-1 rounded-md hover:bg-surface-hover transition-colors"
                  >
                    <X size={16} className="text-txt-tertiary" />
                  </button>
                )}
                <kbd
                  className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md
                               bg-surface-primary text-txt-tertiary text-xs font-mono"
                >
                  ESC
                </kbd>
              </div>

              {/* Results List */}
              <Command.List
                className="max-h-[50vh] overflow-y-auto p-2
                                       [&_[cmdk-group-heading]]:px-3
                                       [&_[cmdk-group-heading]]:py-2
                                       [&_[cmdk-group-heading]]:text-xs
                                       [&_[cmdk-group-heading]]:font-medium
                                       [&_[cmdk-group-heading]]:text-txt-tertiary
                                       [&_[cmdk-group-heading]]:uppercase
                                       [&_[cmdk-group-heading]]:tracking-wider"
              >
                {/* Loading state */}
                {isLoading && !query.trim() && (
                  <div className="py-4 text-center">
                    <div
                      className="inline-block w-5 h-5 border-2 border-accent-secondary/30
                                    border-t-accent-secondary rounded-full animate-spin"
                    />
                    <p className="mt-2 text-xs text-txt-tertiary">Loading...</p>
                  </div>
                )}

                {/* Suggestions when no query */}
                {showSuggestions && <SuggestionsGroup onClose={close} />}

                {/* Recent items when no query */}
                {showRecent && (
                  <RecentItems items={recentItems} onSelect={handleSelect} onClear={clearRecent} />
                )}

                {/* Search results */}
                {showResults &&
                  results.map((group) => (
                    <ResultGroup key={group.type} group={group} onSelect={handleSelect} />
                  ))}

                {/* Actions group (visible when typing) */}
                {query.trim() && <ActionsGroup onClose={close} />}

                {/* Athletes group with avatars and quick actions */}
                <AthletesGroup
                  athletes={allAthletes}
                  onSelectAthlete={handleSelectAthlete}
                  onNavigate={handleNavigate}
                />

                {/* Empty state (only when search has no results AND no athlete matches) */}
                {showEmpty && allAthletes.length === 0 && (
                  <EmptyState query={query} isLoading={isLoading} />
                )}

                {/* Initial state with no recent items */}
                {!query.trim() &&
                  !isLoading &&
                  recentItems.length === 0 &&
                  allAthletes.length === 0 && (
                    <div className="py-8 text-center">
                      <Clock size={32} className="mx-auto text-txt-tertiary mb-2" />
                      <p className="text-sm text-txt-tertiary">No recent items yet</p>
                      <p className="text-xs text-txt-tertiary mt-1">
                        Start searching to see results here
                      </p>
                    </div>
                  )}
              </Command.List>

              {/* Footer */}
              <div
                className="flex items-center justify-between px-4 py-2 border-t border-bdr-secondary
                             text-xs text-txt-tertiary bg-surface-primary/50"
              >
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-primary font-mono">↑</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-primary font-mono">↓</kbd>
                    <span>Navigate</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-primary font-mono">↵</kbd>
                    <span>Select</span>
                  </span>
                </div>
                {totalResults > 0 && (
                  <span>
                    {totalResults} result{totalResults !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// SEARCH TRIGGER BUTTON
// ============================================

/**
 * Button to trigger the command palette from the header.
 * Uses the shared Zustand store directly to avoid fetching search data.
 */
export function SearchTriggerButton() {
  const open = useCommandPaletteStore((state) => state.open);

  return (
    <button
      onClick={open}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                 bg-surface-primary border border-bdr-secondary
                 text-txt-secondary hover:text-txt-primary
                 hover:border-bdr-primary hover:bg-surface-hover
                 transition-all duration-150"
    >
      <MagnifyingGlass size={16} weight="bold" />
      <span className="text-sm hidden sm:inline">Search...</span>
      <kbd
        className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded
                     bg-surface-primary text-xs font-mono ml-2"
      >
        <span className="text-[10px]">⌘</span>K
      </kbd>
    </button>
  );
}
