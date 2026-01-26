/**
 * Command Palette Component
 *
 * Global search interface triggered by Cmd/Ctrl+K.
 * Follows Raycast/Linear command palette pattern.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { AnimatePresence, motion } from 'framer-motion';
import {
  User,
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
import { useGlobalSearch, useCommandPaletteStore } from '../hooks/useGlobalSearch';

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
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-secondary/10
                      flex items-center justify-center">
        <Icon size={18} weight="duotone" className="text-accent-secondary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-txt-primary truncate">
          {result.title}
        </p>
        {result.subtitle && (
          <p className="text-xs text-txt-tertiary truncate">
            {result.subtitle}
          </p>
        )}
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
        <ResultItem
          key={`${result.type}-${result.id}`}
          result={result}
          onSelect={onSelect}
        />
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
        <ResultItem
          key={`recent-${item.type}-${item.id}`}
          result={item}
          onSelect={onSelect}
        />
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
        <div className="inline-block w-5 h-5 border-2 border-accent-secondary/30
                        border-t-accent-secondary rounded-full animate-spin" />
        <p className="mt-2 text-sm text-txt-tertiary">Searching...</p>
      </div>
    );
  }

  if (query.trim()) {
    return (
      <Command.Empty className="py-8 text-center">
        <MagnifyingGlass size={32} className="mx-auto text-txt-tertiary mb-2" />
        <p className="text-sm text-txt-tertiary">
          No results found for "{query}"
        </p>
      </Command.Empty>
    );
  }

  return (
    <div className="py-8 text-center">
      <MagnifyingGlass size={32} className="mx-auto text-txt-tertiary mb-2" />
      <p className="text-sm text-txt-tertiary">
        Start typing to search...
      </p>
    </div>
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

  // Handle keyboard shortcut (Cmd/Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggle, close]);

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

  // Show recent items when no query
  const showRecent = !query.trim() && recentItems.length > 0;
  const showResults = query.trim() && results.length > 0;
  const showEmpty = query.trim() && results.length === 0;

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
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md
                               bg-surface-primary text-txt-tertiary text-xs font-mono">
                  ESC
                </kbd>
              </div>

              {/* Results List */}
              <Command.List className="max-h-[50vh] overflow-y-auto p-2
                                       [&_[cmdk-group-heading]]:px-3
                                       [&_[cmdk-group-heading]]:py-2
                                       [&_[cmdk-group-heading]]:text-xs
                                       [&_[cmdk-group-heading]]:font-medium
                                       [&_[cmdk-group-heading]]:text-txt-tertiary
                                       [&_[cmdk-group-heading]]:uppercase
                                       [&_[cmdk-group-heading]]:tracking-wider">
                {/* Loading state */}
                {isLoading && !query.trim() && (
                  <div className="py-4 text-center">
                    <div className="inline-block w-5 h-5 border-2 border-accent-secondary/30
                                    border-t-accent-secondary rounded-full animate-spin" />
                    <p className="mt-2 text-xs text-txt-tertiary">Loading...</p>
                  </div>
                )}

                {/* Recent items when no query */}
                {showRecent && (
                  <RecentItems
                    items={recentItems}
                    onSelect={handleSelect}
                    onClear={clearRecent}
                  />
                )}

                {/* Search results */}
                {showResults &&
                  results.map((group) => (
                    <ResultGroup
                      key={group.type}
                      group={group}
                      onSelect={handleSelect}
                    />
                  ))}

                {/* Empty state */}
                {showEmpty && <EmptyState query={query} isLoading={isLoading} />}

                {/* Initial state with no recent items */}
                {!query.trim() && !isLoading && recentItems.length === 0 && (
                  <div className="py-8 text-center">
                    <Clock size={32} className="mx-auto text-txt-tertiary mb-2" />
                    <p className="text-sm text-txt-tertiary">
                      No recent items yet
                    </p>
                    <p className="text-xs text-txt-tertiary mt-1">
                      Start searching to see results here
                    </p>
                  </div>
                )}
              </Command.List>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-bdr-secondary
                             text-xs text-txt-tertiary bg-surface-primary/50">
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
                  <span>{totalResults} result{totalResults !== 1 ? 's' : ''}</span>
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
      <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded
                     bg-surface-primary text-xs font-mono ml-2">
        <span className="text-[10px]">⌘</span>K
      </kbd>
    </button>
  );
}
