import { Fragment, useMemo } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronDown, X } from 'lucide-react';
import type { Athlete } from '@v2/types/athletes';

/**
 * Props for SeatSlotSelector component
 */
interface SeatSlotSelectorProps {
  value: string | null;
  onChange: (athleteId: string | null) => void;
  athletes: Athlete[];
  seatNumber: number;
  side: 'Port' | 'Starboard' | 'Cox';
  disabledAthleteIds?: string[];
  placeholder?: string;
}

/**
 * SeatSlotSelector - Dropdown for selecting an athlete to assign to a seat
 *
 * Features:
 * - Uses Headless UI Listbox for accessibility and keyboard navigation
 * - Shows athlete name and side preference in options
 * - Highlights athletes matching seat side preference
 * - Dims/disables athletes already assigned in other seats
 * - "Clear" button to unassign athlete
 *
 * Side matching logic:
 * - Port seat: prefer athletes with side='Port' or 'Both'
 * - Starboard seat: prefer athletes with side='Starboard' or 'Both'
 * - Cox seat: prefer athletes with canCox=true
 *
 * Sorts athletes:
 * 1. Matching side preference first
 * 2. Alphabetical by last name
 */
export function SeatSlotSelector({
  value,
  onChange,
  athletes,
  seatNumber,
  side,
  disabledAthleteIds = [],
  placeholder = 'Select athlete',
}: SeatSlotSelectorProps) {
  // Find selected athlete
  const selectedAthlete = useMemo(
    () => athletes.find((a) => a.id === value),
    [athletes, value]
  );

  // Sort athletes by side match and name
  const sortedAthletes = useMemo(() => {
    return [...athletes].sort((a, b) => {
      const aMatches = matchesSidePreference(a, side);
      const bMatches = matchesSidePreference(b, side);

      // Matching side first
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;

      // Then alphabetical by last name
      return a.lastName.localeCompare(b.lastName);
    });
  }, [athletes, side]);

  return (
    <div className="relative w-full max-w-[200px]">
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          {/* Trigger Button */}
          <Listbox.Button
            className={`
              relative w-full py-2 pl-3 pr-10 text-left
              bg-bg-surface border border-bdr-default rounded-lg
              focus:outline-none focus:ring-2 focus:ring-interactive-primary
              hover:border-bdr-hover transition-colors
              ${!selectedAthlete ? 'text-txt-tertiary' : 'text-txt-primary'}
            `}
          >
            <span className="block truncate text-sm">
              {selectedAthlete
                ? `${selectedAthlete.firstName} ${selectedAthlete.lastName}`
                : placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDown className="h-4 w-4 text-txt-tertiary" aria-hidden="true" />
            </span>
          </Listbox.Button>

          {/* Clear Button (when athlete selected) */}
          {selectedAthlete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="
                absolute inset-y-0 right-8 flex items-center pr-2
                hover:text-txt-primary text-txt-tertiary transition-colors
              "
              title="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Options Dropdown */}
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options
              className={`
                absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg
                bg-bg-surface border border-bdr-default shadow-lg
                py-1 text-sm focus:outline-none
              `}
            >
              {sortedAthletes.map((athlete) => {
                const matches = matchesSidePreference(athlete, side);
                const isDisabled = disabledAthleteIds.includes(athlete.id);

                return (
                  <Listbox.Option
                    key={athlete.id}
                    value={athlete.id}
                    disabled={isDisabled}
                    className={({ active }) =>
                      `
                        relative cursor-pointer select-none py-2 pl-3 pr-9
                        ${active ? 'bg-bg-hover' : ''}
                        ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
                      `
                    }
                  >
                    {({ selected }) => (
                      <div className="flex items-center gap-2">
                        <span
                          className={`
                            block truncate
                            ${selected ? 'font-medium text-txt-primary' : 'font-normal text-txt-secondary'}
                          `}
                        >
                          {athlete.firstName} {athlete.lastName}
                        </span>
                        <SideBadge side={athlete.side} size="sm" />
                        {!matches && (
                          <span className="text-xs text-orange-500">(wrong side)</span>
                        )}
                        {isDisabled && (
                          <span className="text-xs text-txt-tertiary">(assigned)</span>
                        )}
                      </div>
                    )}
                  </Listbox.Option>
                );
              })}

              {/* Empty state */}
              {sortedAthletes.length === 0 && (
                <div className="py-2 pl-3 text-txt-tertiary text-sm">
                  No athletes available
                </div>
              )}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}

/**
 * Helper: Check if athlete matches seat side preference
 */
function matchesSidePreference(athlete: Athlete, seatSide: 'Port' | 'Starboard' | 'Cox'): boolean {
  if (seatSide === 'Cox') {
    return athlete.canCox;
  }

  if (seatSide === 'Port') {
    return athlete.side === 'Port' || athlete.side === 'Both';
  }

  if (seatSide === 'Starboard') {
    return athlete.side === 'Starboard' || athlete.side === 'Both';
  }

  return false;
}

/**
 * SideBadge component - Shows athlete side preference
 */
interface SideBadgeProps {
  side: string | null;
  size?: 'sm' | 'md';
}

function SideBadge({ side, size = 'md' }: SideBadgeProps) {
  if (!side) return null;

  const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1';

  // Use same colors as AthletesTable for consistency
  const colorClasses = {
    Port: 'bg-red-500/10 text-red-600',
    Starboard: 'bg-green-500/10 text-green-600',
    Both: 'bg-blue-500/10 text-blue-600',
    Cox: 'bg-purple-500/10 text-purple-600',
  }[side] || 'bg-gray-500/10 text-gray-600';

  return (
    <span className={`rounded-full font-medium ${sizeClasses} ${colorClasses}`}>
      {side}
    </span>
  );
}
