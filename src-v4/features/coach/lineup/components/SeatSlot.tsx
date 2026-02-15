/**
 * SeatSlot -- drop target for a single seat within a boat.
 *
 * Uses Pragmatic DnD's `dropTargetForElements` via the imperative
 * useEffect+ref pattern. Also wraps the occupant as a DraggableAthleteCard
 * so athletes in seats can be re-dragged to other seats.
 *
 * Visual states:
 * - empty: dashed border, muted placeholder with seat number
 * - occupied: shows DraggableAthleteCard in compact mode
 * - drag-over (empty): copper glow border + subtle copper background pulse
 * - drag-over (occupied): copper glow + swap icon overlay
 * - readOnly: occupant visible but no drop target, no remove button
 */
import { useRef, useState, useEffect } from 'react';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { ArrowLeftRight } from 'lucide-react';
import { DraggableAthleteCard } from './DraggableAthleteCard';
import type { AthleteInfo } from './DraggableAthleteCard';
import type { Side } from '../types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SeatSlotProps {
  boatIndex: number;
  seatNumber: number; // 0 = coxswain
  side: Side;
  isCoxswain?: boolean;
  athlete?: AthleteInfo | null;
  readOnly?: boolean;
  /** For mobile: tap an empty seat to assign selected athlete */
  onTapEmpty?: () => void;
  /** Remove occupant from this seat */
  onRemove?: () => void;
}

// Drag data exposed by this drop target
export interface SeatDropData {
  type: 'seat';
  boatIndex: number;
  seatNumber: number;
  occupantId: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SeatSlot({
  boatIndex,
  seatNumber,
  side,
  isCoxswain = false,
  athlete = null,
  readOnly = false,
  onTapEmpty,
  onRemove,
}: SeatSlotProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isOver, setIsOver] = useState(false);

  // Register drop target via Pragmatic DnD imperative API
  useEffect(() => {
    const el = ref.current;
    if (!el || readOnly) return;

    return dropTargetForElements({
      element: el,
      getData: () => ({
        type: 'seat',
        boatIndex,
        seatNumber,
        occupantId: athlete?.id ?? null,
      }),
      canDrop: ({ source }) => {
        // Don't drop on self
        return source.data.athleteId !== athlete?.id;
      },
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: () => setIsOver(false),
    });
  }, [boatIndex, seatNumber, athlete?.id, readOnly]);

  const isEmpty = !athlete;

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      onClick={() => {
        if (isEmpty && onTapEmpty) onTapEmpty();
      }}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && isEmpty && onTapEmpty) {
          e.preventDefault();
          onTapEmpty();
        }
      }}
      aria-label={`${isCoxswain ? 'Coxswain' : `Seat ${seatNumber}`}, ${side}${isEmpty ? ', empty' : `, ${athlete.firstName} ${athlete.lastName}`}`}
      className={`
        group relative flex items-center gap-2 rounded-xl transition-all duration-200 ease-out
        ${
          isEmpty
            ? 'border-2 border-dashed border-ink-border/50 bg-ink-well/20 py-3 px-3'
            : 'border border-ink-border bg-ink-raised/40 p-1'
        }
        ${
          isOver
            ? 'border-2 border-accent-copper/60 bg-accent-copper/5 shadow-[0_0_20px_-5px_oklch(0.62_0.12_55/0.3)] scale-[1.02]'
            : ''
        }
        ${isOver && isEmpty ? 'animate-pulse-subtle' : ''}
        ${isEmpty && onTapEmpty ? 'cursor-pointer hover:border-ink-border-strong hover:bg-ink-well' : ''}
      `.trim()}
    >
      {/* Seat label */}
      <div className="flex-shrink-0 w-7 text-center">
        {isCoxswain ? (
          <span className="text-[10px] font-bold text-accent-primary uppercase">Cox</span>
        ) : (
          <span
            className={`text-xs font-semibold ${isOver ? 'text-accent-copper' : 'text-ink-muted'}`}
          >
            {seatNumber}
          </span>
        )}
      </div>

      {/* Content: empty placeholder or occupied athlete card */}
      <div className="flex-1 min-w-0">
        {isEmpty ? (
          <span
            className={`text-xs select-none ${isOver ? 'text-accent-copper/80' : 'text-ink-muted'}`}
          >
            {isCoxswain ? 'Assign coxswain' : `Seat ${seatNumber}`}
          </span>
        ) : (
          <DraggableAthleteCard
            athlete={athlete}
            source={isCoxswain ? 'coxswain' : 'seat'}
            boatIndex={boatIndex}
            seatNumber={seatNumber}
            readOnly={readOnly}
            compact
            className="!bg-transparent !border-0 !px-1 !py-0.5"
          />
        )}
      </div>

      {/* Swap icon overlay (occupied + drag hovering) */}
      {isOver && !isEmpty && (
        <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-md bg-accent-copper/15 text-accent-copper">
          <ArrowLeftRight size={12} />
        </div>
      )}

      {/* Side indicator (not for coxswain) */}
      {!isCoxswain && (
        <span
          className={`
            flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded
            ${
              side === 'Port'
                ? 'bg-data-poor/10 text-data-poor'
                : 'bg-data-excellent/10 text-data-excellent'
            }
          `}
        >
          {side === 'Port' ? 'P' : 'S'}
        </span>
      )}

      {/* Remove button (occupied + not readOnly) */}
      {!isEmpty && !readOnly && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="
            flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100
            hover:bg-ink-hover text-ink-muted hover:text-ink-primary
            transition-opacity duration-100
          "
          aria-label={`Remove ${athlete.firstName} ${athlete.lastName}`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
              d="M3 3l6 6M9 3l-6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
