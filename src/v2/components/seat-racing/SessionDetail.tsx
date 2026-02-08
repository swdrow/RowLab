import { useSeatRaceSession } from '@v2/hooks/useSeatRaceSessions';
import { useDeleteSession } from '@v2/hooks/useSeatRaceSessions';
import { useRecalculateRatings } from '@v2/hooks/useAthleteRatings';
import { X, Trash2, RefreshCcw, MapPin, Wind, Droplets } from 'lucide-react';
import type { SessionWithDetails, SeatRacePiece, SeatRaceBoat } from '@v2/types/seatRacing';

interface SessionDetailProps {
  sessionId: string;
  onClose: () => void;
  onDelete?: () => void;
}

/**
 * SessionDetail Component
 *
 * Displays detailed view of a single seat race session including:
 * - Session metadata (date, boat class, conditions)
 * - Location and description
 * - Pieces with boats sorted by finish time
 * - Boat details with athlete assignments
 * - Actions: Recalculate Ratings, Delete Session
 */
export function SessionDetail({ sessionId, onClose, onDelete }: SessionDetailProps) {
  const { session, isLoading } = useSeatRaceSession(sessionId);
  const { deleteSession, isDeleting } = useDeleteSession();
  const { recalculate, isRecalculating } = useRecalculateRatings();

  const handleDelete = () => {
    if (!session) return;

    const confirmed = confirm(
      `Delete seat racing session from ${new Date(session.date).toLocaleDateString()}?\n\nThis will not delete calculated ratings.`
    );

    if (confirmed) {
      deleteSession(sessionId, {
        onSuccess: () => {
          onDelete?.();
          onClose();
        },
      });
    }
  };

  const handleRecalculate = () => {
    recalculate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-interactive-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <p className="text-txt-secondary">Session not found</p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 text-sm text-txt-secondary hover:text-txt-primary"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-surface">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-bdr-default">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-txt-primary">
                {new Date(session.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h2>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Boat class badge */}
              <span className="px-2 py-1 text-xs font-medium rounded-md bg-interactive-primary/10 text-interactive-primary">
                {session.boatClass}
              </span>

              {/* Conditions badges */}
              {session.waterConditions && (
                <span className="px-2 py-1 text-xs font-medium rounded-md bg-bg-subtle text-txt-secondary flex items-center gap-1">
                  <Droplets size={12} />
                  {session.waterConditions}
                </span>
              )}
              {session.windConditions && (
                <span className="px-2 py-1 text-xs font-medium rounded-md bg-bg-subtle text-txt-secondary flex items-center gap-1">
                  <Wind size={12} />
                  {session.windConditions}
                </span>
              )}
            </div>

            {/* Location */}
            {session.location && (
              <div className="flex items-center gap-2 mt-3 text-sm text-txt-secondary">
                <MapPin size={14} />
                <span>{session.location}</span>
              </div>
            )}

            {/* Description */}
            {session.description && (
              <p className="mt-3 text-sm text-txt-secondary">{session.description}</p>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="ml-4 p-2 rounded-lg hover:bg-bg-hover transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-txt-secondary" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-interactive-primary text-button-primary-text rounded-md hover:bg-interactive-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCcw size={16} className={isRecalculating ? 'animate-spin' : ''} />
            {isRecalculating ? 'Recalculating...' : 'Recalculate Ratings'}
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--data-poor)]/10 text-[var(--data-poor)] hover:bg-[var(--data-poor)]/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} />
            Delete Session
          </button>
        </div>
      </div>

      {/* Pieces list */}
      <div className="flex-1 overflow-y-auto p-6">
        {session.pieces && session.pieces.length > 0 ? (
          <div className="space-y-6">
            {session.pieces
              .sort((a, b) => a.pieceNumber - b.pieceNumber)
              .map((piece) => (
                <PieceDetail key={piece.id} piece={piece} />
              ))}
          </div>
        ) : (
          <div className="text-center py-12 text-txt-secondary">
            <p>No pieces recorded for this session</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * PieceDetail Component
 *
 * Displays a single piece with all boats sorted by finish time
 */
function PieceDetail({ piece }: { piece: SeatRacePiece }) {
  // Sort boats by finish time (fastest first, nulls last)
  const sortedBoats = [...(piece.boats || [])].sort((a, b) => {
    if (a.finishTime === null) return 1;
    if (b.finishTime === null) return -1;
    return a.finishTime - b.finishTime;
  });

  return (
    <div className="border border-bdr-default rounded-lg overflow-hidden bg-bg-base">
      {/* Piece header */}
      <div className="px-4 py-3 bg-bg-subtle border-b border-bdr-default">
        <h3 className="text-sm font-semibold text-txt-primary">Piece {piece.pieceNumber}</h3>
        {piece.distance && <p className="text-xs text-txt-tertiary mt-0.5">{piece.distance}m</p>}
      </div>

      {/* Boats */}
      <div className="divide-y divide-bdr-default">
        {sortedBoats.length > 0 ? (
          sortedBoats.map((boat, index) => (
            <BoatDetail key={boat.id} boat={boat} rank={index + 1} />
          ))
        ) : (
          <div className="px-4 py-6 text-center text-sm text-txt-tertiary">No boats recorded</div>
        )}
      </div>
    </div>
  );
}

/**
 * BoatDetail Component
 *
 * Displays a single boat with rank, time, and athlete assignments
 */
function BoatDetail({ boat, rank }: { boat: SeatRaceBoat; rank: number }) {
  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  // Get seat assignments sorted by seat number
  const seatAssignments = (boat.assignments || [])
    .filter((a) => a.seat !== null)
    .sort((a, b) => (a.seat || 0) - (b.seat || 0));

  // Get coxswain assignment
  const coxswain = (boat.assignments || []).find((a) => a.seat === null);

  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          {/* Rank badge */}
          <div
            className={`
              flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
              ${
                rank === 1
                  ? 'bg-amber-500/20 text-amber-600 ring-2 ring-amber-500/30'
                  : 'bg-bg-subtle text-txt-tertiary'
              }
            `}
          >
            {rank}
          </div>

          <div>
            <p className="font-semibold text-txt-primary">{boat.name || `Boat ${rank}`}</p>
            <p className="text-sm text-txt-secondary font-mono">{formatTime(boat.finishTime)}</p>
          </div>
        </div>
      </div>

      {/* Athlete assignments */}
      {(seatAssignments.length > 0 || coxswain) && (
        <div className="mt-3 ml-11">
          {/* Seats */}
          {seatAssignments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {seatAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-bg-subtle rounded-md"
                >
                  <span className="font-medium text-txt-tertiary">{assignment.seat}:</span>
                  <span className="text-txt-secondary">
                    {assignment.athlete
                      ? `${assignment.athlete.firstName} ${assignment.athlete.lastName}`
                      : 'Empty'}
                  </span>
                  {assignment.side && (
                    <span
                      className={`
                        ml-1 text-xs font-medium
                        ${assignment.side === 'Port' ? 'text-[var(--data-poor)]' : 'text-[var(--data-excellent)]'}
                      `}
                    >
                      {assignment.side === 'Port' ? 'P' : 'S'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Coxswain */}
          {coxswain && (
            <div className="flex items-center gap-1 px-2 py-1 text-xs bg-bg-subtle rounded-md inline-flex">
              <span className="font-medium text-txt-tertiary">Cox:</span>
              <span className="text-txt-secondary">
                {coxswain.athlete
                  ? `${coxswain.athlete.firstName} ${coxswain.athlete.lastName}`
                  : 'Empty'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
