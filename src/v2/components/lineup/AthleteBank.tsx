import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import useLineupStore from '@/store/lineupStore';
import { useAthletes } from '../../hooks/useAthletes';
import { DraggableAthleteCard } from './DraggableAthleteCard';
import type { AthleteBankProps } from '@v2/types/lineup';

/**
 * AthleteBank - Left sidebar showing available (unassigned) athletes
 *
 * Displays athletes in a searchable list with avatar and side preference.
 * Athletes shown here are NOT currently assigned to any boat seat.
 *
 * Features:
 * - Get available athletes from useAthletes TanStack Query hook
 * - Filter out assigned athletes based on draft.assignments
 * - Search filter by name
 * - Shows athlete avatar (uses AthleteAvatar pattern)
 * - Shows side preference badge (Port/Starboard/Both/Cox)
 * - Total count of available athletes at top
 * - Fixed width sidebar (280px), full height, scrollable
 *
 * Per CONTEXT.md: "Athlete bank positioned in left sidebar - classic builder pattern"
 *
 * Athletes are draggable using DraggableAthleteCard with source='bank'
 */
export function AthleteBank({ className = '' }: AthleteBankProps & { lineupId: string | null }) {
  const [searchQuery, setSearchQuery] = useState('');

  // V3 hooks: TanStack Query for athletes
  const { allAthletes } = useAthletes();

  // Read activeBoats from V1 store to track which athletes are assigned
  const activeBoats = useLineupStore((state: any) => state.activeBoats);

  // Get available athletes (those not assigned to any seat in activeBoats)
  const availableAthletes = useMemo(() => {
    const assignedIds = new Set<string>();
    activeBoats.forEach((boat: any) => {
      boat.seats.forEach((seat: any) => {
        if (seat.athlete?.id) assignedIds.add(seat.athlete.id);
      });
      if (boat.coxswain?.id) assignedIds.add(boat.coxswain.id);
    });
    return allAthletes.filter((athlete) => !assignedIds.has(athlete.id));
  }, [allAthletes, activeBoats]);

  // Filter athletes by search query
  const filteredAthletes = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableAthletes;
    }

    const query = searchQuery.toLowerCase();
    return availableAthletes.filter((athlete) => {
      const fullName = `${athlete.firstName} ${athlete.lastName}`.toLowerCase();
      return fullName.includes(query);
    });
  }, [availableAthletes, searchQuery]);

  return (
    <div
      className={`
        w-[280px] h-full flex flex-col
        border-r border-bdr-default bg-bg-surface
        ${className}
      `}
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-bdr-subtle">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-txt-primary">Available Athletes</h2>
          <span className="text-xs font-medium text-txt-tertiary px-2 py-0.5 rounded-full bg-bg-active">
            {filteredAthletes.length}
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-tertiary"
          />
          <input
            type="text"
            placeholder="Search athletes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full pl-9 pr-3 py-2 rounded-md text-sm
              border border-bdr-default bg-bg-base
              text-txt-primary placeholder-txt-tertiary
              focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent
              transition-colors
            "
          />
        </div>
      </div>

      {/* Athletes List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAthletes.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-txt-tertiary">
              {searchQuery ? 'No athletes match your search' : 'All athletes are assigned to boats'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredAthletes.map((athlete) => (
              <DraggableAthleteCard key={athlete.id} athlete={athlete} source={{ type: 'bank' }} />
            ))}
          </div>
        )}
      </div>

      {/* Footer - Instructions */}
      <div className="px-4 py-3 border-t border-bdr-subtle bg-bg-base">
        <p className="text-xs text-txt-tertiary">
          Drag athletes to boat seats to build your lineup
        </p>
      </div>
    </div>
  );
}

export default AthleteBank;
