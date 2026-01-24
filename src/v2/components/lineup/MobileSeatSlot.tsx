import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { validateSeatAssignment } from '@/utils/boatConfig';
import { AthleteAvatar } from '@v2/components/athletes/AthleteAvatar';
import { SeatWarningBadge } from './SeatWarningBadge';
import type { SeatSlotData, SeatWarning, Athlete } from '@v2/types/lineup';

/**
 * Props for MobileSeatSlot component
 */
interface MobileSeatSlotProps {
  boatId: string;
  seat: SeatSlotData;
  isCoxswain?: boolean;
  isSelected?: boolean;
  onTap: () => void;
  onRemoveAthlete?: () => void;
}

/**
 * MobileSeatSlot - Tap-to-select seat slot for mobile lineup builder
 *
 * Features:
 * - Larger touch target (min 48px height per accessibility)
 * - Visual selected state (border/background change)
 * - Shows assigned athlete or "Tap to assign"
 * - Clear/remove button for assigned seats
 * - Tap to select seat (opens athlete selector)
 * - Shows warning badges (from validation)
 *
 * Per CONTEXT.md: "Touch devices use tap-to-select, tap-to-place workflow"
 */
export function MobileSeatSlot({
  boatId,
  seat,
  isCoxswain = false,
  isSelected = false,
  onTap,
  onRemoveAthlete,
}: MobileSeatSlotProps) {
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
    if (isCoxswain && !seat.athlete.canCox) {
      warnings.push({
        type: 'cox',
        message: 'Non-coxswain assigned to coxswain seat',
      });
    }
  }

  const hasWarnings = warnings.length > 0;

  return (
    <motion.button
      layout
      onClick={onTap}
      className={`
        group relative flex items-center gap-3 p-4 rounded-lg border transition-colors
        min-h-[48px] w-full text-left
        ${isEmpty ? 'border-dashed border-bdr-default bg-bg-base' : 'border-bdr-default bg-bg-surface'}
        ${isSelected ? 'border-accent-blue bg-accent-blue/10 ring-2 ring-accent-blue/30' : ''}
        ${!isSelected && hasWarnings ? 'border-amber-500/50' : ''}
        active:scale-[0.98] transition-transform
      `}
    >
      {/* Warning Badge (if warnings present) */}
      {hasWarnings && <SeatWarningBadge warnings={warnings} />}

      {/* Seat Number or Cox Label */}
      <div className="flex-shrink-0 w-10 text-center">
        {isCoxswain ? (
          <div className="text-sm font-semibold text-purple-600">Cox</div>
        ) : (
          <div className="text-base font-semibold text-txt-primary">{seat.seatNumber}</div>
        )}
      </div>

      {/* Seat Content */}
      <div className="flex-1 min-w-0">
        {isEmpty ? (
          <div className="text-sm text-txt-tertiary">Tap to assign</div>
        ) : (
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <AthleteAvatar
              firstName={seat.athlete.firstName}
              lastName={seat.athlete.lastName}
              size="sm"
            />
            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-txt-primary truncate">
                {seat.athlete.firstName} {seat.athlete.lastName}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Remove Button (occupied seats only) */}
      {!isEmpty && onRemoveAthlete && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering onTap
            onRemoveAthlete();
          }}
          className="flex-shrink-0 p-2 rounded-lg hover:bg-bg-hover transition-colors"
          aria-label={isCoxswain ? 'Remove coxswain' : 'Remove athlete'}
        >
          <X size={16} className="text-txt-tertiary" />
        </button>
      )}

      {/* Side Indicator (rowing seats only) */}
      {!isCoxswain && (
        <div className="flex-shrink-0">
          <span
            className={`
              text-xs font-medium px-2 py-1 rounded-full
              ${seat.side === 'Port' ? 'bg-red-500/10 text-red-600' : 'bg-green-500/10 text-green-600'}
            `}
          >
            {seat.side}
          </span>
        </div>
      )}
    </motion.button>
  );
}

export default MobileSeatSlot;
