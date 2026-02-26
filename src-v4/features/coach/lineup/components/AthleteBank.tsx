/**
 * AthleteBank -- scrollable panel of unassigned athletes.
 *
 * Features:
 * - Search filter by name
 * - Side filter buttons (All / Port / Starboard)
 * - Scrollable DraggableAthleteCard list
 * - Drop target itself: dropping an athlete here unassigns them
 * - Count badge in header
 * - Skeleton loading state
 *
 * This component is also a drop target via Pragmatic DnD. When an athlete
 * card is dropped on the bank, it dispatches UNASSIGN_ATHLETE.
 */
import { useState, useMemo, useRef, useEffect, type Dispatch } from 'react';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { DraggableAthleteCard } from './DraggableAthleteCard';
import type { AthleteInfo } from './DraggableAthleteCard';
import type { LineupAction } from '../hooks/useLineupState';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AthleteBankProps {
  /** Full athlete roster (Map of id -> info) */
  athletes: Map<string, AthleteInfo>;
  /** IDs of athletes not assigned to any boat */
  unassignedIds: string[];
  dispatch: Dispatch<LineupAction>;
  readOnly?: boolean;
  selectedAthleteId?: string | null;
  isLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Side filter type
// ---------------------------------------------------------------------------

type SideFilter = 'all' | 'Port' | 'Starboard';

const SIDE_FILTERS: { value: SideFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'Port', label: 'Port' },
  { value: 'Starboard', label: 'Stbd' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AthleteBank({
  athletes,
  unassignedIds,
  dispatch,
  readOnly = false,
  selectedAthleteId,
  isLoading = false,
}: AthleteBankProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sideFilter, setSideFilter] = useState<SideFilter>('all');
  const [isDropOver, setIsDropOver] = useState(false);
  const bankRef = useRef<HTMLDivElement>(null);

  // Register as drop target for unassigning athletes
  useEffect(() => {
    const el = bankRef.current;
    if (!el || readOnly) return;

    return dropTargetForElements({
      element: el,
      getData: () => ({ type: 'bank' }),
      canDrop: ({ source }) => {
        // Only accept athletes that are currently in a seat
        return source.data.source === 'seat' || source.data.source === 'coxswain';
      },
      onDragEnter: () => setIsDropOver(true),
      onDragLeave: () => setIsDropOver(false),
      onDrop: () => setIsDropOver(false),
    });
  }, [readOnly]);

  // Monitor for drops on the bank to dispatch unassign
  useEffect(() => {
    if (readOnly) return;

    return monitorForElements({
      onDrop: ({ source, location }) => {
        const target = location.current.dropTargets[0];
        if (!target) return;
        if (target.data.type !== 'bank') return;

        const athleteId = source.data.athleteId as string;
        dispatch({ type: 'UNASSIGN_ATHLETE', athleteId });
      },
    });
  }, [dispatch, readOnly]);

  // Build filtered athlete list
  const filteredAthletes = useMemo(() => {
    const list: AthleteInfo[] = [];
    for (const id of unassignedIds) {
      const athlete = athletes.get(id);
      if (!athlete) continue;

      // Side filter
      if (sideFilter !== 'all' && athlete.side !== sideFilter && athlete.side !== 'Both') {
        continue;
      }

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = `${athlete.firstName} ${athlete.lastName}`.toLowerCase();
        if (!name.includes(q)) continue;
      }

      list.push(athlete);
    }

    // Sort alphabetically by last name
    return list.sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [athletes, unassignedIds, searchQuery, sideFilter]);

  return (
    <div
      ref={bankRef}
      className={`
        flex flex-col h-full rounded-xl overflow-hidden transition-all duration-150
        ${isDropOver ? 'ring-2 ring-accent/40 bg-accent-teal/5' : 'panel'}
      `}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-edge-default/30">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-sm font-display font-semibold text-text-bright">Athletes</h3>
          <span className="text-xs font-medium text-text-faint bg-void-raised px-2 py-0.5 rounded-md">
            {unassignedIds.length}
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-faint"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden
          >
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
            <path
              d="M9.5 9.5L12.5 12.5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full pl-8 pr-3 py-1.5 rounded-lg text-xs
              bg-void-deep border border-edge-default
              text-text-bright placeholder:text-text-faint
              focus:outline-none focus:border-accent-teal focus:ring-1 focus:ring-accent/30
              transition-colors
            "
          />
        </div>

        {/* Side filter */}
        <div className="flex gap-1">
          {SIDE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setSideFilter(f.value)}
              className={`
                flex-1 text-[10px] font-semibold py-1 rounded-md transition-colors
                ${
                  sideFilter === f.value
                    ? 'bg-accent-teal/15 text-accent-teal'
                    : 'text-text-faint hover:text-text-dim hover:bg-void-overlay'
                }
              `}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Athletes list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          // Skeleton loading state
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-11 rounded-lg bg-void-raised animate-shimmer" />
          ))
        ) : filteredAthletes.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <p className="text-xs text-text-faint">
              {searchQuery
                ? 'No athletes match'
                : unassignedIds.length === 0
                  ? 'All athletes assigned'
                  : 'No athletes available'}
            </p>
          </div>
        ) : (
          filteredAthletes.map((athlete) => (
            <DraggableAthleteCard
              key={athlete.id}
              athlete={athlete}
              source="bank"
              readOnly={readOnly}
              isSelected={selectedAthleteId === athlete.id}
              onTap={
                !readOnly
                  ? () =>
                      dispatch({
                        type: 'SELECT_ATHLETE',
                        athleteId: selectedAthleteId === athlete.id ? null : athlete.id,
                      })
                  : undefined
              }
            />
          ))
        )}
      </div>

      {/* Footer hint */}
      {!readOnly && (
        <div className="px-3 py-2 border-t border-edge-default/20">
          <p className="text-[10px] text-text-faint text-center">Drag to seat or tap to select</p>
        </div>
      )}
    </div>
  );
}
