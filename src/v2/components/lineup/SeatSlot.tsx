import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { validateSeatAssignment } from '@/utils/boatConfig';
import { DraggableAthleteCard } from './DraggableAthleteCard';
import { SeatWarningBadge } from './SeatWarningBadge';
import { SPRING_CONFIG } from '@v2/utils/animations';
import type { SeatSlotData, SeatWarning } from '@v2/types/lineup';

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
 * SeatSlot - Droppable seat slot with validation warnings and drag-over feedback
 *
 * Features:
 * - Uses useDroppable hook from @dnd-kit/core
 * - Validation warnings for port/starboard mismatches and coxswain seat violations
 * - Visual feedback on drag-over (green for valid match, yellow for warnings)
 * - Non-blocking warnings: coach can always override assignments
 * - Empty state: dashed border, "Empty" text
 * - Occupied state: shows DraggableAthleteCard (athlete in seat is also draggable)
 * - Displays seat number (left), side indicator badge (right)
 * - Remove button on hover for occupied seats
 * - Rounded corners, proper padding, V2 design tokens
 *
 * Per CONTEXT.md:
 * - "Port/starboard validation: soft warning - allow drop but show warning badge"
 * - "Coxswain seat validation: soft warning - non-cox in cox seat shows warning"
 * - "Save always allowed regardless of warnings - warnings are informational only"
 *
 * The SeatSlot wraps DraggableAthleteCard when occupied - athletes in seats can be
 * dragged to other seats for rearranging.
 */
export function SeatSlot({ boatId, seat, isCoxswain = false, onRemoveAthlete }: SeatSlotProps) {
  const isEmpty = !seat.athlete;

  // Calculate validation warnings
  const warnings: SeatWarning[] = [];

  if (seat.athlete) {
    // Port/starboard side check
    const sideValidation = validateSeatAssignment(seat.athlete, seat);
    if (sideValidation.warning) {
      warnings.push({ type: 'side', message: sideValidation.warning });
    }

    // Coxswain seat check (only for coxswain seats)
    // Note: Athlete type doesn't have isCoxswain in V2, check by side === 'Cox'
    if (isCoxswain && seat.athlete.side !== 'Cox') {
      warnings.push({
        type: 'cox',
        message: 'Non-coxswain assigned to coxswain seat',
      });
    }
  }

  const hasWarnings = warnings.length > 0;

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
    <motion.div
      ref={setNodeRef}
      layout
      transition={SPRING_CONFIG}
      animate={{
        scale: isOver ? 1.02 : 1,
        boxShadow: isOver ? '0 8px 25px rgba(0,0,0,0.15)' : '0 0 0 rgba(0,0,0,0)',
      }}
      whileHover={{ scale: isEmpty ? 1 : 1.01 }}
      role="button"
      tabIndex={0}
      aria-label={`Seat ${seat.seatNumber}, ${isEmpty ? 'empty' : `occupied by ${seat.athlete?.firstName} ${seat.athlete?.lastName}`}${isCoxswain ? ', coxswain position' : ''}`}
      aria-describedby="seat-drop-instructions"
      className={`
        group relative flex items-center gap-3 p-3 rounded-lg border transition-colors
        focus-visible:ring-2 focus-visible:ring-interactive-primary focus-visible:ring-offset-2
        ${
          isEmpty
            ? 'border-dashed border-bdr-default bg-bg-base'
            : 'border-bdr-default bg-bg-surface'
        }
        ${
          isOver
            ? hasWarnings
              ? 'border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20'
              : 'border-green-500 bg-green-500/5 ring-2 ring-green-500/20'
            : ''
        }
        ${!isEmpty && !isOver && hasWarnings ? 'hover:border-amber-500/50' : ''}
        ${!isEmpty && !isOver && !hasWarnings ? 'hover:border-interactive-primary/50' : ''}
      `}
    >
      {/* Warning Badge (if warnings present) */}
      {hasWarnings && <SeatWarningBadge warnings={warnings} />}
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
            {seat.athlete && (
              <DraggableAthleteCard
                athlete={seat.athlete}
                source={{
                  type: isCoxswain ? 'coxswain' : 'seat',
                  boatId,
                  seatNumber: isCoxswain ? undefined : seat.seatNumber,
                }}
                className="flex-1 !p-0 !border-0 !bg-transparent hover:!bg-transparent cursor-grab"
              />
            )}
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
                  ? 'bg-data-poor/10 text-data-poor'
                  : 'bg-data-excellent/10 text-data-excellent'
              }
            `}
          >
            {seat.side}
          </span>
        </div>
      )}

      {isCoxswain && (
        <div className="flex-shrink-0 w-16 text-right">
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-accent-primary/10 text-accent-primary">
            Cox
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default SeatSlot;
