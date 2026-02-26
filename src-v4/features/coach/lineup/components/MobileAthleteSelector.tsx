/**
 * MobileAthleteSelector -- bottom sheet for tap-to-assign workflow on mobile.
 *
 * On touch devices, drag-drop is awkward (conflicts with scroll). Instead:
 * 1. User taps a seat -> bottom sheet opens showing unassigned athletes
 * 2. User taps an athlete -> athlete is assigned to the seat
 * 3. Sheet closes
 *
 * Alternatively, user can tap an athlete in AthleteBank (sets selectedAthleteId)
 * then tap a SeatSlot to place them. This component supports both flows.
 *
 * Uses CSS transitions (no framer-motion dependency) for the slide-up animation.
 */
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { AthleteInfo } from './DraggableAthleteCard';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MobileAthleteSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (athleteId: string) => void;
  /** Full athlete roster */
  athletes: Map<string, AthleteInfo>;
  /** Unassigned athlete IDs */
  unassignedIds: string[];
  /** Title context, e.g. "Seat 3 - Starboard" */
  seatLabel?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MobileAthleteSelector({
  isOpen,
  onClose,
  onSelect,
  athletes,
  unassignedIds,
  seatLabel,
}: MobileAthleteSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const sheetRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus search input when sheet opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to let animation start
      const timer = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(timer);
    }
    // Clear search when closing
    setSearchQuery('');
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  // Build filtered list
  const filteredAthletes = useMemo(() => {
    const list: AthleteInfo[] = [];
    for (const id of unassignedIds) {
      const athlete = athletes.get(id);
      if (!athlete) continue;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = `${athlete.firstName} ${athlete.lastName}`.toLowerCase();
        if (!name.includes(q)) continue;
      }
      list.push(athlete);
    }
    return list.sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [athletes, unassignedIds, searchQuery]);

  const handleSelect = useCallback(
    (athleteId: string) => {
      onSelect(athleteId);
      onClose();
    },
    [onSelect, onClose]
  );

  // Side badge helper
  function sideBadge(side?: string): { text: string; classes: string } | null {
    switch (side) {
      case 'Cox':
        return { text: 'Cox', classes: 'bg-accent-teal-primary/10 text-accent-teal-primary' };
      case 'Both':
        return { text: 'Both', classes: 'bg-data-good/10 text-data-good' };
      case 'Port':
        return { text: 'P', classes: 'bg-data-poor/10 text-data-poor' };
      case 'Starboard':
        return { text: 'S', classes: 'bg-data-excellent/10 text-data-excellent' };
      default:
        return null;
    }
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden
      />

      {/* Bottom sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={seatLabel ? `Select athlete for ${seatLabel}` : 'Select athlete'}
        className="
          fixed bottom-0 left-0 right-0 z-50
          bg-void-surface rounded-t-2xl
          shadow-lg
          flex flex-col
          max-h-[80vh]
          animate-[slideUp_0.25s_ease-out]
        "
      >
        {/* Swipe handle */}
        <div className="flex items-center justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-edge-default rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-edge-default/30">
          <div>
            <h2 className="text-base font-display font-semibold text-text-bright">
              Select Athlete
            </h2>
            {seatLabel && <p className="text-xs text-text-faint mt-0.5">{seatLabel}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-void-overlay text-text-dim transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint"
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
              ref={inputRef}
              type="text"
              placeholder="Search athletes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full pl-9 pr-4 py-2.5 rounded-xl text-sm
                bg-void-deep border border-edge-default
                text-text-bright placeholder:text-text-faint
                focus:outline-none focus:border-accent-teal focus:ring-1 focus:ring-accent/30
                transition-colors
              "
            />
          </div>
        </div>

        {/* Athletes list */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {filteredAthletes.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-text-faint">
                {searchQuery ? 'No athletes match' : 'No athletes available'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredAthletes.map((athlete) => {
                const badge = sideBadge(athlete.side);
                const initials =
                  `${athlete.firstName[0] || ''}${athlete.lastName[0] || ''}`.toUpperCase();

                return (
                  <button
                    key={athlete.id}
                    onClick={() => handleSelect(athlete.id)}
                    className="
                      w-full flex items-center gap-3 p-3 rounded-xl
                      bg-void-raised/60 border border-edge-default
                      hover:bg-void-overlay hover:border-edge-hover
                      active:scale-[0.98]
                      transition-all duration-100
                    "
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-lg bg-void-overlay text-text-dim font-semibold text-sm flex items-center justify-center flex-shrink-0">
                      {initials}
                    </div>

                    {/* Name */}
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-text-bright truncate">
                        {athlete.firstName} {athlete.lastName}
                      </p>
                      {(athlete.erg2k || athlete.weight) && (
                        <p className="text-[11px] text-text-faint mt-0.5">
                          {[athlete.erg2k, athlete.weight ? `${athlete.weight}kg` : null]
                            .filter(Boolean)
                            .join(' / ')}
                        </p>
                      )}
                    </div>

                    {/* Side badge */}
                    {badge && (
                      <span
                        className={`flex-shrink-0 text-[10px] font-semibold px-2 py-1 rounded ${badge.classes}`}
                      >
                        {badge.text}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
