import { useDroppable } from '@dnd-kit/core';
import { X } from 'lucide-react';
import { DraggableAthleteCard } from './DraggableAthleteCard';
import type { SeatSlotData } from '@v2/types/lineup';

/**
 * Props for SeatSlot component
 */
interface SeatSlotProps {
  boatId: string;
  seat: SeatSlotData;
  isCoxswain?: boolean;
  onRemoveAthlete?: () => void;
}

/**
 * SeatSlot - Droppable seat slot with drag-over feedback
 *
 * Features:
 * - Uses useDroppable hook from @dnd-kit/core
 * - Visual feedback on drag-over (green border for valid, red for invalid - validation in 08-03)
 * - Empty state: dashed border, "Empty" text
 * - Occupied state: shows DraggableAthleteCard (athlete in seat is also draggable)
 * - Displays seat number (left), side indicator badge (right)
 * - Remove button on hover for occupied seats
 * - Rounded corners, proper padding, V2 design tokens
 *
 * Per CONTEXT.md: "Seats show glow/highlight border on drag-over (green=valid, red=invalid)"
 *
 * The SeatSlot wraps DraggableAthleteCard when occupied - athletes in seats can be
 * dragged to other seats for rearranging.
 */
export function SeatSlot({ boatId, seat, isCoxswain = false, onRemoveAthlete }: SeatSlotProps) {
  const isEmpty = !seat.athlete;

  // Setup droppable
  const { setNodeRef, isOver } = useDroppable({
    id: isCoxswain ? `${boatId}-coxswain` : `${boatId}-seat-${seat.seatNumber}`,
    data: {
      boatId,
      seat,
      isCoxswain,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        group relative flex items-center gap-3 p-3 rounded-lg border transition-all
        ${
          isEmpty
            ? 'border-dashed border-bdr-default bg-bg-base'
            : 'border-bdr-default bg-bg-surface'
        }
        ${isOver ? 'border-green-500 bg-green-500/5 ring-2 ring-green-500/20' : ''}
        ${!isEmpty && !isOver ? 'hover:border-interactive-primary/50' : ''}
      `}
    >
      {/* Seat Number or Cox Label */}
      <div className="flex-shrink-0 w-8 text-center">
        {isCoxswain ? (
          <div className="text-xs font-semibold text-purple-600">Cox</div>
        ) : (
          <div className="text-sm font-semibold text-txt-primary">{seat.seatNumber}</div>
        )}
      </div>

      {/* Seat Content */}
      <div className="flex-1 min-w-0">
        {isEmpty ? (
          <div className="text-sm text-txt-tertiary">Empty</div>
        ) : (
          <div className="flex items-center gap-3">
            {/* Occupied seats show DraggableAthleteCard for rearranging */}
            <DraggableAthleteCard
              athlete={seat.athlete}
              source={{
                type: isCoxswain ? 'coxswain' : 'seat',
                boatId,
                seatNumber: isCoxswain ? undefined : seat.seatNumber,
              }}
              className="flex-1 !p-0 !border-0 !bg-transparent hover:!bg-transparent cursor-grab"
            />
            {onRemoveAthlete && (
              <button
                onClick={onRemoveAthlete}
                className="
                  p-1 rounded opacity-0 group-hover:opacity-100
                  hover:bg-bg-hover transition-opacity
                "
                title={isCoxswain ? 'Remove coxswain' : 'Remove athlete'}
              >
                <X size={14} className="text-txt-tertiary hover:text-txt-primary" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Side Indicator */}
      {!isCoxswain && (
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
      )}

      {isCoxswain && (
        <div className="flex-shrink-0 w-16 text-right">
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-500/10 text-purple-600">
            Cox
          </span>
        </div>
      )}
    </div>
  );
}

export default SeatSlot;
