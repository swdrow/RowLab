import { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import useSeatRaceStore from '../../store/seatRaceStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

/**
 * Format seconds to "M:SS.s" format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
function formatTime(seconds) {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return '';
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const wholeSecs = Math.floor(secs);
  const tenths = Math.round((secs - wholeSecs) * 10);
  return `${mins}:${wholeSecs.toString().padStart(2, '0')}.${tenths}`;
}

/**
 * Parse "M:SS.s" format to seconds
 * @param {string} timeStr - Time string in "M:SS.s" format
 * @returns {number|null} Time in seconds or null if invalid
 */
function parseTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    return null;
  }

  const trimmed = timeStr.trim();
  if (!trimmed) {
    return null;
  }

  // Match patterns: "M:SS.s", "M:SS", "SS.s", "SS"
  const match = trimmed.match(/^(\d+):(\d{1,2})(?:\.(\d))?$|^(\d+)(?:\.(\d))?$/);

  if (!match) {
    return null;
  }

  let minutes = 0;
  let seconds = 0;
  let tenths = 0;

  if (match[1] !== undefined) {
    // Format: M:SS.s or M:SS
    minutes = parseInt(match[1], 10);
    seconds = parseInt(match[2], 10);
    tenths = match[3] ? parseInt(match[3], 10) : 0;
  } else {
    // Format: SS.s or SS
    seconds = parseInt(match[4], 10);
    tenths = match[5] ? parseInt(match[5], 10) : 0;
  }

  if (seconds >= 60) {
    return null;
  }

  return minutes * 60 + seconds + tenths / 10;
}

/**
 * Time input component for boat finish times
 */
function TimeInput({ value, onUpdate, disabled }) {
  const [localValue, setLocalValue] = useState(formatTime(value));
  const [error, setError] = useState(null);

  const handleBlur = useCallback(() => {
    const parsed = parseTime(localValue);
    if (localValue && parsed === null) {
      setError('Invalid format (use M:SS.s)');
      return;
    }
    setError(null);
    if (parsed !== value) {
      onUpdate(parsed);
    }
  }, [localValue, value, onUpdate]);

  const handleChange = (e) => {
    setLocalValue(e.target.value);
    if (error) {
      setError(null);
    }
  };

  return (
    <Input
      size="sm"
      variant="default"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="0:00.0"
      disabled={disabled}
      error={error}
      className="w-24"
    />
  );
}

/**
 * Single boat row display
 */
function BoatRow({ boat, onTimeUpdate, loading }) {
  return (
    <div className="flex items-center gap-4 py-2 px-3 bg-surface-850 rounded-lg">
      <div className="flex-1">
        <span className="text-text-primary font-medium">
          {boat.name || `Boat ${boat.id}`}
        </span>
        {boat.rowers && boat.rowers.length > 0 && (
          <div className="text-text-tertiary text-xs mt-0.5">
            {boat.rowers.map((r) => r.name || r.athleteName).join(', ')}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-text-tertiary text-sm">Time:</span>
        <TimeInput
          value={boat.finishTimeSeconds}
          onUpdate={(time) => onTimeUpdate(boat.id, time)}
          disabled={loading}
        />
      </div>
    </div>
  );
}

/**
 * Single piece display with its boats
 */
function PieceCard({ piece, pieceIndex, onBoatTimeUpdate, loading }) {
  return (
    <Card variant="default" padding="md" className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Badge variant="primary" size="md">
            Piece {pieceIndex + 1}
          </Badge>
          {piece.distanceMeters && (
            <span className="text-text-secondary text-sm">
              {piece.distanceMeters}m
            </span>
          )}
          {piece.direction && (
            <Badge variant="default" size="sm">
              {piece.direction}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {piece.boats && piece.boats.length > 0 ? (
          piece.boats.map((boat) => (
            <BoatRow
              key={boat.id}
              boat={boat}
              onTimeUpdate={onBoatTimeUpdate}
              loading={loading}
            />
          ))
        ) : (
          <p className="text-text-tertiary text-sm italic py-2">
            No boats in this piece
          </p>
        )}
      </div>
    </Card>
  );
}

/**
 * Add piece form section
 */
function AddPieceSection({ sessionId, onPieceAdded }) {
  const { addPiece, loading } = useSeatRaceStore();
  const [distance, setDistance] = useState('');
  const [direction, setDirection] = useState('');
  const [error, setError] = useState(null);

  const handleAddPiece = async () => {
    if (!distance) {
      setError('Distance is required');
      return;
    }

    const distanceNum = parseInt(distance, 10);
    if (isNaN(distanceNum) || distanceNum <= 0) {
      setError('Distance must be a positive number');
      return;
    }

    try {
      setError(null);
      await addPiece(sessionId, {
        distanceMeters: distanceNum,
        direction: direction || null,
      });
      setDistance('');
      setDirection('');
      if (onPieceAdded) {
        onPieceAdded();
      }
    } catch (err) {
      setError(err.message || 'Failed to add piece');
    }
  };

  return (
    <Card variant="gradient" padding="md" className="mb-6">
      <CardHeader className="pb-3 mb-3">
        <CardTitle className="text-base">Add Piece</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-4">
          <Input
            label="Distance (m)"
            size="sm"
            variant="default"
            type="number"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="500"
            className="w-32"
            error={error && !distance ? error : undefined}
          />
          <Input
            label="Direction"
            size="sm"
            variant="default"
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            placeholder="Upstream"
            className="w-40"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddPiece}
            isLoading={loading}
            disabled={!distance}
          >
            Add Piece
          </Button>
        </div>
        {error && distance && (
          <p className="text-spectrum-red text-xs mt-2">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * SeatRaceEntryForm - Data entry form for seat race sessions
 *
 * @param {Object} props
 * @param {Object} props.session - The session object with pieces
 * @param {function} props.onClose - Callback to close/go back
 */
export default function SeatRaceEntryForm({ session, onClose }) {
  const { updateBoatTime, fetchSession, loading, error } = useSeatRaceStore();

  const handleBoatTimeUpdate = useCallback(
    async (boatId, finishTimeSeconds) => {
      try {
        await updateBoatTime(boatId, finishTimeSeconds);
      } catch (err) {
        console.error('Failed to update boat time:', err);
      }
    },
    [updateBoatTime]
  );

  const handlePieceAdded = useCallback(() => {
    // Refresh session data after adding a piece
    if (session?.id) {
      fetchSession(session.id);
    }
  }, [session?.id, fetchSession]);

  if (!session) {
    return (
      <div className="p-6">
        <p className="text-text-secondary">No session selected</p>
        <Button variant="ghost" size="sm" onClick={onClose} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const pieces = session.pieces || [];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">
            {session.name || 'Seat Race Session'}
          </h2>
          {session.date && (
            <p className="text-text-secondary text-sm mt-1">
              {new Date(session.date).toLocaleDateString()}
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-spectrum-red/10 border border-spectrum-red/30 rounded-lg">
          <p className="text-spectrum-red text-sm">{error}</p>
        </div>
      )}

      {/* Add Piece Section */}
      <AddPieceSection sessionId={session.id} onPieceAdded={handlePieceAdded} />

      {/* Pieces List */}
      <div className="mb-4">
        <h3 className="text-lg font-medium text-text-primary mb-3">
          Pieces ({pieces.length})
        </h3>

        {pieces.length > 0 ? (
          pieces.map((piece, index) => (
            <PieceCard
              key={piece.id}
              piece={piece}
              pieceIndex={index}
              onBoatTimeUpdate={handleBoatTimeUpdate}
              loading={loading}
            />
          ))
        ) : (
          <Card variant="ghost" padding="lg" className="text-center">
            <p className="text-text-tertiary">
              No pieces yet. Add a piece to get started.
            </p>
          </Card>
        )}
      </div>

      {/* Session Summary */}
      {pieces.length > 0 && (
        <Card variant="elevated" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Total Pieces</p>
              <p className="text-text-primary font-semibold text-lg">
                {pieces.length}
              </p>
            </div>
            <div>
              <p className="text-text-secondary text-sm">Total Boats</p>
              <p className="text-text-primary font-semibold text-lg">
                {pieces.reduce((sum, p) => sum + (p.boats?.length || 0), 0)}
              </p>
            </div>
            <div>
              <p className="text-text-secondary text-sm">Times Recorded</p>
              <p className="text-text-primary font-semibold text-lg">
                {pieces.reduce(
                  (sum, p) =>
                    sum +
                    (p.boats?.filter((b) => b.finishTimeSeconds != null)
                      .length || 0),
                  0
                )}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// Icons
function ArrowLeftIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 19l-7-7m0 0l7-7m-7 7h18"
      />
    </svg>
  );
}

// Export helper functions for testing
export { formatTime, parseTime };
