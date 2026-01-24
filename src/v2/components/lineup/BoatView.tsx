import { X } from 'lucide-react';
import useLineupStore from '@/store/lineupStore';
import { SeatSlot } from './SeatSlot';
import type { BoatViewProps } from '@v2/types/lineup';

/**
 * BoatView - Boat display with vertical seat arrangement
 *
 * Displays a boat with seats arranged vertically (bow at top, stroke at bottom)
 * matching how lineups are traditionally written.
 *
 * Features:
 * - Boat header with boat class name and shell name (if set)
 * - Seats arranged VERTICALLY: bow (seat 1) at TOP, stroke at BOTTOM
 * - Each seat shows: seat number, side indicator (Port/Starboard), athlete or empty state
 * - Coxswain position shown separately at stern/bottom for stern-coxed boats
 * - Empty seats show "Empty" placeholder with dashed border
 * - Occupied seats show athlete name and avatar thumbnail
 * - Remove button on hover for occupied seats
 *
 * Per CONTEXT.md: "Boat seats arranged vertically (bow at top, stern at bottom) - mirrors how lineups are written"
 *
 * Seats use SeatSlot component with drag-drop support
 */
export function BoatView({ boat, className = '' }: BoatViewProps) {
  const removeFromSeat = useLineupStore((state) => state.removeFromSeat);
  const removeFromCoxswain = useLineupStore((state) => state.removeFromCoxswain);
  const removeBoat = useLineupStore((state) => state.removeBoat);

  // Reverse seats array so bow (seat 1) is at top
  // In boatConfig, seats are generated high to low, but we want to display bow at top
  const seatsTopToBottom = [...boat.seats].reverse();

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Boat Header */}
      <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-bg-surface border border-bdr-default">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-txt-primary">{boat.name}</h3>
          {boat.shellName && (
            <p className="text-sm text-txt-tertiary mt-0.5">Shell: {boat.shellName}</p>
          )}
        </div>
        <button
          onClick={() => removeBoat(boat.id)}
          className="
            p-2 rounded-lg
            hover:bg-bg-hover
            text-txt-tertiary hover:text-txt-primary
            transition-colors
          "
          title="Remove boat"
        >
          <X size={18} />
        </button>
      </div>

      {/* Seats - Bow at Top */}
      <div className="space-y-2">
        {/* Label: Bow */}
        <div className="px-4">
          <span className="text-xs font-semibold text-txt-tertiary uppercase tracking-wider">
            Bow
          </span>
        </div>

        {/* Seats (reversed to show bow at top) */}
        {seatsTopToBottom.map((seat) => (
          <SeatSlot
            key={`${boat.id}-seat-${seat.seatNumber}`}
            boatId={boat.id}
            seat={seat}
            isCoxswain={false}
            onRemoveAthlete={
              seat.athlete ? () => removeFromSeat(boat.id, seat.seatNumber) : undefined
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
        <div className="pt-4 border-t border-bdr-subtle">
          <SeatSlot
            boatId={boat.id}
            seat={{ seatNumber: 0, side: 'Port', athlete: boat.coxswain }}
            isCoxswain={true}
            onRemoveAthlete={boat.coxswain ? () => removeFromCoxswain(boat.id) : undefined}
          />
        </div>
      )}
    </div>
  );
}

export default BoatView;
