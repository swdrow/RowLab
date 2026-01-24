import { X } from 'lucide-react';
import useLineupStore from '@/store/lineupStore';
import { AthleteAvatar } from '@v2/components/athletes/AthleteAvatar';
import type { BoatViewProps, SeatSlotData } from '@v2/types/lineup';

/**
 * SeatSlot - Individual seat display component
 */
interface SeatSlotProps {
  boatId: string;
  seat: SeatSlotData;
  onRemoveAthlete?: () => void;
}

function SeatSlot({ boatId, seat, onRemoveAthlete }: SeatSlotProps) {
  const isEmpty = !seat.athlete;

  return (
    <div
      className={`
        relative flex items-center gap-3 p-3 rounded-lg border transition-all
        ${
          isEmpty
            ? 'border-dashed border-bdr-default bg-bg-base'
            : 'border-bdr-default bg-bg-surface hover:border-interactive-primary/50'
        }
      `}
    >
      {/* Seat Number */}
      <div className="flex-shrink-0 w-8 text-center">
        <div className="text-sm font-semibold text-txt-primary">{seat.seatNumber}</div>
      </div>

      {/* Seat Content */}
      <div className="flex-1 min-w-0">
        {isEmpty ? (
          <div className="text-sm text-txt-tertiary">Empty</div>
        ) : (
          <div className="flex items-center gap-3">
            <AthleteAvatar
              firstName={seat.athlete.firstName}
              lastName={seat.athlete.lastName}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-txt-primary truncate">
                {seat.athlete.firstName} {seat.athlete.lastName}
              </div>
              <div className="text-xs text-txt-tertiary">{seat.side}</div>
            </div>
            {onRemoveAthlete && (
              <button
                onClick={onRemoveAthlete}
                className="
                  p-1 rounded opacity-0 group-hover:opacity-100
                  hover:bg-bg-hover transition-opacity
                "
                title="Remove athlete"
              >
                <X size={14} className="text-txt-tertiary hover:text-txt-primary" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Side Indicator */}
      <div className="flex-shrink-0 w-16 text-right">
        <span
          className={`
            text-xs font-medium px-2 py-1 rounded-full
            ${
              seat.side === 'Port'
                ? 'bg-red-500/10 text-red-600'
                : 'bg-green-500/10 text-green-600'
            }
          `}
        >
          {seat.side}
        </span>
      </div>
    </div>
  );
}

/**
 * CoxswainSlot - Coxswain position display component
 */
interface CoxswainSlotProps {
  boatId: string;
  coxswain: SeatSlotData['athlete'];
  onRemoveAthlete?: () => void;
}

function CoxswainSlot({ boatId, coxswain, onRemoveAthlete }: CoxswainSlotProps) {
  const isEmpty = !coxswain;

  return (
    <div
      className={`
        relative flex items-center gap-3 p-3 rounded-lg border transition-all
        ${
          isEmpty
            ? 'border-dashed border-bdr-default bg-bg-base'
            : 'border-bdr-default bg-bg-surface hover:border-interactive-primary/50'
        }
      `}
    >
      {/* Cox Label */}
      <div className="flex-shrink-0 w-8 text-center">
        <div className="text-xs font-semibold text-purple-600">Cox</div>
      </div>

      {/* Cox Content */}
      <div className="flex-1 min-w-0">
        {isEmpty ? (
          <div className="text-sm text-txt-tertiary">Empty</div>
        ) : (
          <div className="flex items-center gap-3">
            <AthleteAvatar
              firstName={coxswain.firstName}
              lastName={coxswain.lastName}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-txt-primary truncate">
                {coxswain.firstName} {coxswain.lastName}
              </div>
              <div className="text-xs text-txt-tertiary">Coxswain</div>
            </div>
            {onRemoveAthlete && (
              <button
                onClick={onRemoveAthlete}
                className="
                  p-1 rounded opacity-0 group-hover:opacity-100
                  hover:bg-bg-hover transition-opacity
                "
                title="Remove coxswain"
              >
                <X size={14} className="text-txt-tertiary hover:text-txt-primary" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Side Indicator (Coxswain) */}
      <div className="flex-shrink-0 w-16 text-right">
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-500/10 text-purple-600">
          Cox
        </span>
      </div>
    </div>
  );
}

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
 * Note: Seats are NOT droppable yet (drop setup in plan 08-02)
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
          <CoxswainSlot
            boatId={boat.id}
            coxswain={boat.coxswain}
            onRemoveAthlete={boat.coxswain ? () => removeFromCoxswain(boat.id) : undefined}
          />
        </div>
      )}
    </div>
  );
}

export default BoatView;
