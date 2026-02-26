/**
 * BoatView -- renders a single boat with its seats as SeatSlot components.
 *
 * Uses Pragmatic DnD `monitorForElements` to listen for drops anywhere in the
 * tree and dispatch MOVE_ATHLETE / SWAP_ATHLETES / ASSIGN_COXSWAIN actions.
 *
 * Layout:
 * - Sweep boats (8+, 4+, 4-, 2-, pair): 2-column grid (port / starboard)
 * - Sculling boats (4x, 2x, 1x): single column
 * - Coxswain seat at top (if boat hasCoxswain)
 * - Seats ordered bow (1) at top, stroke (N) at bottom
 *
 * The monitor handles ALL drop logic for this boat -- individual SeatSlot
 * components just register as drop targets and provide visual feedback.
 */
import { useEffect, type Dispatch } from 'react';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { SeatSlot } from './SeatSlot';
import type { AthleteInfo, AthleteDragData } from './DraggableAthleteCard';
import type { SeatDropData } from './SeatSlot';
import type { LineupBoat } from '../types';
import type { LineupAction } from '../hooks/useLineupState';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BoatViewProps {
  boat: LineupBoat;
  boatIndex: number;
  dispatch: Dispatch<LineupAction>;
  readOnly?: boolean;
  /** Map of athleteId -> AthleteInfo for rendering names/badges */
  athletes: Map<string, AthleteInfo>;
  /** For mobile tap-select: pass selected athlete to SeatSlot onTapEmpty */
  selectedAthleteId?: string | null;
  onRemoveBoat?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Whether a boat class uses sculling (single oar per side = 1 column layout) */
function isSculling(boatClass: string): boolean {
  return boatClass.includes('x') || boatClass === '1x';
}

/** Display label for boat class */
function boatClassLabel(boatClass: string): string {
  const labels: Record<string, string> = {
    '8+': 'Eight',
    '4+': 'Coxed Four',
    '4x': 'Quad',
    '2x': 'Double',
    '1x': 'Single',
    '4-': 'Straight Four',
    '2-': 'Pair',
    pair: 'Pair',
  };
  return labels[boatClass] || boatClass;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BoatView({
  boat,
  boatIndex,
  dispatch,
  readOnly = false,
  athletes,
  selectedAthleteId,
  onRemoveBoat,
}: BoatViewProps) {
  // Global monitor for drops targeting seats in this boat
  useEffect(() => {
    if (readOnly) return;

    return monitorForElements({
      onDrop: ({ source, location }) => {
        const target = location.current.dropTargets[0];
        if (!target) return;

        const sourceData = source.data as unknown as AthleteDragData;
        const targetData = target.data as unknown as SeatDropData;

        // Only handle drops targeting our boat
        if (targetData.type !== 'seat' || targetData.boatIndex !== boatIndex) return;

        const athleteId = sourceData.athleteId as string;
        const targetSeatNumber = targetData.seatNumber as number;
        const occupantId = targetData.occupantId as string | null;

        if (occupantId && occupantId !== athleteId) {
          // Target seat is occupied by someone else -- swap
          dispatch({
            type: 'SWAP_ATHLETES',
            sourceAthleteId: athleteId,
            targetAthleteId: occupantId,
          });
        } else {
          // Target seat is empty or same athlete -- move
          dispatch({
            type: 'MOVE_ATHLETE',
            athleteId,
            targetBoatIndex: boatIndex,
            targetSeatNumber,
          });
        }
      },
    });
  }, [boatIndex, dispatch, readOnly]);

  const sculling = isSculling(boat.boatClass);

  // Build seat array from bow (1) to stroke (N) -- already in order from types
  const seats = boat.seats;

  // Handle mobile tap-assign: when user taps an empty seat and an athlete is selected
  function handleTapEmptySeat(seatNumber: number) {
    if (!selectedAthleteId) return;
    dispatch({
      type: 'MOVE_ATHLETE',
      athleteId: selectedAthleteId,
      targetBoatIndex: boatIndex,
      targetSeatNumber: seatNumber,
    });
    // Clear selection after assign
    dispatch({ type: 'SELECT_ATHLETE', athleteId: null });
  }

  function handleTapEmptyCox() {
    if (!selectedAthleteId) return;
    dispatch({
      type: 'ASSIGN_COXSWAIN',
      athleteId: selectedAthleteId,
      boatIndex,
    });
    dispatch({ type: 'SELECT_ATHLETE', athleteId: null });
  }

  return (
    <div className="relative overflow-hidden rounded-[28px] border-2 border-edge-default/30 bg-void-surface/40 p-1 shadow-md">
      {/* Boat header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-bold text-accent-teal">{boat.boatClass}</span>
          <span className="text-sm font-medium text-text-bright truncate">
            {boatClassLabel(boat.boatClass)}
          </span>
          {boat.shellName && (
            <span className="text-xs text-text-faint truncate">{boat.shellName}</span>
          )}
        </div>
        {!readOnly && onRemoveBoat && (
          <button
            onClick={onRemoveBoat}
            className="
              p-1.5 rounded-lg text-text-faint hover:text-text-bright
              hover:bg-void-overlay transition-colors
            "
            aria-label="Remove boat"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M3.5 3.5l7 7M10.5 3.5l-7 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Bow indicator (pointed shape) */}
      <div className="flex justify-center pb-1">
        <svg width="40" height="16" viewBox="0 0 40 16" className="text-edge-default/40" aria-hidden>
          <path d="M20 0 L38 16 L2 16 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Coxswain seat (if applicable, at bow) */}
      {boat.hasCoxswain && (
        <div className="px-3 pb-1">
          <SeatSlot
            boatIndex={boatIndex}
            seatNumber={0}
            side="Port"
            isCoxswain
            athlete={boat.coxswainId ? athletes.get(boat.coxswainId) : null}
            readOnly={readOnly}
            onTapEmpty={selectedAthleteId ? handleTapEmptyCox : undefined}
            onRemove={
              boat.coxswainId && !readOnly
                ? () => dispatch({ type: 'UNASSIGN_ATHLETE', athleteId: boat.coxswainId! })
                : undefined
            }
          />
        </div>
      )}

      {/* Seats grid */}
      <div className="px-3 pb-3 pt-2">
        {/* Port / Starboard column labels (sweep boats only) */}
        {!sculling && seats.length > 1 && (
          <div className="grid grid-cols-2 gap-1.5 px-1 pb-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-data-poor/40" />
              <span className="text-[10px] font-semibold text-data-poor uppercase tracking-wider">
                Port
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-data-excellent/40" />
              <span className="text-[10px] font-semibold text-data-excellent uppercase tracking-wider">
                Starboard
              </span>
            </div>
          </div>
        )}

        {/* Bow label (sculling / single column) */}
        {sculling && seats.length > 1 && (
          <div className="px-1 pb-1.5">
            <span className="text-[10px] font-semibold text-text-faint uppercase tracking-wider">
              Bow
            </span>
          </div>
        )}

        <div className={`grid gap-1.5 ${sculling ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {seats.map((seat, idx) => (
            <div
              key={`${boatIndex}-seat-${seat.seatNumber}`}
              className={
                idx % 2 === 0 && !sculling
                  ? ''
                  : sculling && idx % 2 === 1
                    ? 'bg-void-deep/10 rounded-lg'
                    : ''
              }
            >
              <SeatSlot
                boatIndex={boatIndex}
                seatNumber={seat.seatNumber}
                side={seat.side}
                athlete={seat.athleteId ? athletes.get(seat.athleteId) : null}
                readOnly={readOnly}
                onTapEmpty={
                  selectedAthleteId ? () => handleTapEmptySeat(seat.seatNumber) : undefined
                }
                onRemove={
                  seat.athleteId && !readOnly
                    ? () => dispatch({ type: 'UNASSIGN_ATHLETE', athleteId: seat.athleteId! })
                    : undefined
                }
              />
            </div>
          ))}
        </div>

        {/* Stroke label */}
        {seats.length > 1 && (
          <div className="px-1 pt-1.5 flex justify-center">
            <span className="text-[10px] font-semibold text-text-faint uppercase tracking-wider">
              Stroke
            </span>
          </div>
        )}
      </div>

      {/* Stern indicator */}
      <div className="flex justify-center pt-0.5 pb-2">
        <div className="w-12 h-1 rounded-full bg-edge-default/30" />
      </div>
    </div>
  );
}
