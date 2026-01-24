import { useState, useMemo } from 'react';
import { Undo, Redo } from 'lucide-react';
import useLineupStore from '@/store/lineupStore';
import { MobileSeatSlot } from './MobileSeatSlot';
import { MobileAthleteSelector } from './MobileAthleteSelector';
import { AddBoatButton } from './AddBoatButton';
import type { Athlete, SeatSlotData } from '@v2/types/lineup';

/**
 * Selected seat state for tap-to-select workflow
 */
interface SelectedSeat {
  boatId: string;
  seatNumber?: number;
  isCoxswain: boolean;
}

/**
 * MobileLineupBuilder - Full-screen mobile lineup builder with tap-to-select workflow
 *
 * Features:
 * - Full-width boat view (no sidebar)
 * - Boat seats in vertical stack
 * - Bottom action bar with undo/redo and save
 * - Tap-to-select workflow:
 *   1. User taps empty seat
 *   2. Seat becomes "selected" (highlighted)
 *   3. MobileAthleteSelector opens
 *   4. User taps athlete
 *   5. Athlete assigned to selected seat
 *   6. Selector closes
 *
 * Alternative for occupied seats:
 * - Tap occupied seat opens selector for swap
 * - Remove button returns athlete to bank
 *
 * Per CONTEXT.md:
 * - "Full redesign for mobile - different UI entirely for small screens"
 * - "Touch devices use tap-to-select, tap-to-place workflow"
 */
export function MobileLineupBuilder() {
  const activeBoats = useLineupStore((state) => state.activeBoats);
  const assignToSeat = useLineupStore((state) => state.assignToSeat);
  const assignToCoxswain = useLineupStore((state) => state.assignToCoxswain);
  const removeFromSeat = useLineupStore((state) => state.removeFromSeat);
  const removeFromCoxswain = useLineupStore((state) => state.removeFromCoxswain);
  const undo = useLineupStore((state) => state.undo);
  const redo = useLineupStore((state) => state.redo);
  const canUndo = useLineupStore((state) => state.canUndo);
  const canRedo = useLineupStore((state) => state.canRedo);
  const getAvailableAthletes = useLineupStore((state) => state.getAvailableAthletes);

  const [selectedSeat, setSelectedSeat] = useState<SelectedSeat | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);

  // Get available athletes
  const availableAthletes = useMemo(() => {
    return getAvailableAthletes();
  }, [getAvailableAthletes]);

  // Get assigned athlete IDs for selector
  const assignedAthleteIds = useMemo(() => {
    const ids = new Set<string>();
    activeBoats.forEach((boat) => {
      boat.seats.forEach((seat) => {
        if (seat.athlete) ids.add(seat.athlete.id);
      });
      if (boat.coxswain) ids.add(boat.coxswain.id);
    });
    return ids;
  }, [activeBoats]);

  // Handle seat tap
  function handleSeatTap(boatId: string, seatNumber?: number, isCoxswain = false) {
    setSelectedSeat({ boatId, seatNumber, isCoxswain });
    setSelectorOpen(true);
  }

  // Handle athlete selection
  function handleAthleteSelect(athlete: Athlete) {
    if (!selectedSeat) return;

    const { boatId, seatNumber, isCoxswain } = selectedSeat;

    if (isCoxswain) {
      assignToCoxswain(boatId, athlete);
    } else if (seatNumber !== undefined) {
      assignToSeat(boatId, seatNumber, athlete);
    }

    setSelectedSeat(null);
    setSelectorOpen(false);
  }

  // Handle remove athlete
  function handleRemoveAthlete(boatId: string, seatNumber?: number, isCoxswain = false) {
    if (isCoxswain) {
      removeFromCoxswain(boatId);
    } else if (seatNumber !== undefined) {
      removeFromSeat(boatId, seatNumber);
    }
  }

  return (
    <div className="flex flex-col h-full bg-bg-base">
      {/* Main content - scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Add Boat Button */}
        <div className="mb-4">
          <AddBoatButton />
        </div>

        {/* Empty State */}
        {activeBoats.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center px-4">
              <p className="text-base font-medium text-txt-secondary mb-2">No boats in workspace</p>
              <p className="text-sm text-txt-tertiary">
                Tap the button above to add a boat and start building your lineup
              </p>
            </div>
          </div>
        )}

        {/* Boats */}
        <div className="space-y-6">
          {activeBoats.map((boat) => {
            // Reverse seats array so bow (seat 1) is at top
            const seatsTopToBottom = [...boat.seats].reverse();

            return (
              <div key={boat.id} className="flex flex-col gap-3">
                {/* Boat Header */}
                <div className="px-4 py-3 rounded-lg bg-bg-surface border border-bdr-default">
                  <h3 className="text-lg font-semibold text-txt-primary">{boat.name}</h3>
                  {boat.shellName && (
                    <p className="text-sm text-txt-tertiary mt-0.5">Shell: {boat.shellName}</p>
                  )}
                </div>

                {/* Seats */}
                <div className="space-y-2">
                  {/* Label: Bow */}
                  <div className="px-4">
                    <span className="text-xs font-semibold text-txt-tertiary uppercase tracking-wider">
                      Bow
                    </span>
                  </div>

                  {/* Seats (reversed to show bow at top) */}
                  {seatsTopToBottom.map((seat) => (
                    <MobileSeatSlot
                      key={`${boat.id}-seat-${seat.seatNumber}`}
                      boatId={boat.id}
                      seat={seat}
                      isCoxswain={false}
                      isSelected={
                        selectedSeat?.boatId === boat.id &&
                        selectedSeat?.seatNumber === seat.seatNumber &&
                        !selectedSeat?.isCoxswain
                      }
                      onTap={() => handleSeatTap(boat.id, seat.seatNumber, false)}
                      onRemoveAthlete={
                        seat.athlete
                          ? () => handleRemoveAthlete(boat.id, seat.seatNumber, false)
                          : undefined
                      }
                    />
                  ))}

                  {/* Label: Stroke */}
                  <div className="px-4 pt-2">
                    <span className="text-xs font-semibold text-txt-tertiary uppercase tracking-wider">
                      Stroke
                    </span>
                  </div>
                </div>

                {/* Coxswain (if boat has coxswain) */}
                {boat.hasCoxswain && (
                  <div className="pt-2 border-t border-bdr-subtle">
                    <MobileSeatSlot
                      boatId={boat.id}
                      seat={{
                        seatNumber: 0,
                        side: 'Port',
                        athlete: boat.coxswain,
                      }}
                      isCoxswain={true}
                      isSelected={
                        selectedSeat?.boatId === boat.id && selectedSeat?.isCoxswain === true
                      }
                      onTap={() => handleSeatTap(boat.id, undefined, true)}
                      onRemoveAthlete={
                        boat.coxswain ? () => handleRemoveAthlete(boat.id, undefined, true) : undefined
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex-shrink-0 border-t border-bdr-default bg-bg-surface px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Undo/Redo */}
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={!canUndo()}
              className="
                p-2 rounded-lg transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed
                enabled:hover:bg-bg-hover enabled:active:bg-bg-active
              "
              aria-label="Undo"
              title="Undo"
            >
              <Undo size={20} className="text-txt-secondary" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo()}
              className="
                p-2 rounded-lg transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed
                enabled:hover:bg-bg-hover enabled:active:bg-bg-active
              "
              aria-label="Redo"
              title="Redo"
            >
              <Redo size={20} className="text-txt-secondary" />
            </button>
          </div>

          {/* Available Athletes Count */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-txt-tertiary">Available:</span>
            <span className="text-sm font-semibold text-txt-primary px-2 py-1 bg-bg-active rounded">
              {availableAthletes.length}
            </span>
          </div>
        </div>
      </div>

      {/* Athlete Selector Bottom Sheet */}
      <MobileAthleteSelector
        isOpen={selectorOpen}
        onClose={() => {
          setSelectorOpen(false);
          setSelectedSeat(null);
        }}
        onSelect={handleAthleteSelect}
        availableAthletes={availableAthletes}
        assignedAthleteIds={assignedAthleteIds}
      />
    </div>
  );
}

export default MobileLineupBuilder;
