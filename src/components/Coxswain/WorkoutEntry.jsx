import { useState, useEffect, useRef } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';

/**
 * WorkoutEntry - Capture piece data from the water
 *
 * Mobile-optimized inputs for recording piece times and stroke rates.
 * Supports workout templates (e.g., "3x1500m") and auto-saves drafts.
 *
 * @param {Array} pieces - Array of saved pieces
 * @param {Function} onSavePiece - Callback to save a piece
 * @param {string} workoutTemplate - Optional preset (e.g., "3x1500m")
 * @param {Function} onDeletePiece - Callback to delete a piece
 */
export function WorkoutEntry({
  pieces = [],
  onSavePiece,
  workoutTemplate,
  onDeletePiece,
}) {
  const [activePiece, setActivePiece] = useState(pieces.length + 1);
  const [timeMinutes, setTimeMinutes] = useState('');
  const [timeSeconds, setTimeSeconds] = useState('');
  const [timeTenths, setTimeTenths] = useState('');
  const [strokeRate, setStrokeRate] = useState('');
  const [distance, setDistance] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const minutesRef = useRef(null);
  const secondsRef = useRef(null);
  const tenthsRef = useRef(null);
  const strokeRateRef = useRef(null);

  // Parse workout template for piece count
  const templatePieceCount = workoutTemplate
    ? parseInt(workoutTemplate.split('x')[0]) || 3
    : null;
  const totalPieces = templatePieceCount || Math.max(pieces.length + 1, 3);

  // Auto-save draft to localStorage
  useEffect(() => {
    const draft = { timeMinutes, timeSeconds, timeTenths, strokeRate, distance, notes, activePiece };
    localStorage.setItem('coxswain-workout-draft', JSON.stringify(draft));
  }, [timeMinutes, timeSeconds, timeTenths, strokeRate, distance, notes, activePiece]);

  // Load draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('coxswain-workout-draft');
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.activePiece > pieces.length) {
          setTimeMinutes(draft.timeMinutes || '');
          setTimeSeconds(draft.timeSeconds || '');
          setTimeTenths(draft.timeTenths || '');
          setStrokeRate(draft.strokeRate || '');
          setDistance(draft.distance || '');
          setNotes(draft.notes || '');
          setActivePiece(draft.activePiece || pieces.length + 1);
        }
      }
    } catch (e) {
      console.warn('Failed to load workout draft:', e);
    }
  }, []);

  // Auto-advance to next input field
  const handleMinutesChange = (value) => {
    const num = value.replace(/\D/g, '').slice(0, 2);
    setTimeMinutes(num);
    if (num.length === 2) {
      secondsRef.current?.focus();
    }
  };

  const handleSecondsChange = (value) => {
    const num = value.replace(/\D/g, '').slice(0, 2);
    // Validate seconds (0-59)
    if (parseInt(num) > 59) return;
    setTimeSeconds(num);
    if (num.length === 2) {
      tenthsRef.current?.focus();
    }
  };

  const handleTenthsChange = (value) => {
    const num = value.replace(/\D/g, '').slice(0, 1);
    setTimeTenths(num);
    if (num.length === 1) {
      strokeRateRef.current?.focus();
    }
  };

  const handleStrokeRateChange = (value) => {
    const num = value.replace(/\D/g, '').slice(0, 2);
    setStrokeRate(num);
  };

  const formatTime = () => {
    if (!timeMinutes && !timeSeconds) return null;
    const mins = timeMinutes.padStart(1, '0');
    const secs = (timeSeconds || '00').padStart(2, '0');
    const tenths = timeTenths || '0';
    return `${mins}:${secs}.${tenths}`;
  };

  const handleSave = async () => {
    const time = formatTime();
    if (!time) return;

    setIsSaving(true);

    const piece = {
      number: activePiece,
      time,
      strokeRate: strokeRate ? parseInt(strokeRate) : null,
      distance: distance ? parseInt(distance) : null,
      notes: notes || null,
      timestamp: new Date().toISOString(),
    };

    try {
      await onSavePiece?.(piece);

      // Clear form and advance to next piece
      setTimeMinutes('');
      setTimeSeconds('');
      setTimeTenths('');
      setStrokeRate('');
      setDistance('');
      setNotes('');
      setActivePiece(activePiece + 1);
      localStorage.removeItem('coxswain-workout-draft');

      // Focus back to minutes input
      minutesRef.current?.focus();
    } catch (e) {
      console.error('Failed to save piece:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePieceSelect = (pieceNum) => {
    const existingPiece = pieces.find((p) => p.number === pieceNum);
    if (existingPiece) {
      // Load existing piece data for editing
      const [mins, rest] = existingPiece.time.split(':');
      const [secs, tenths] = rest.split('.');
      setTimeMinutes(mins);
      setTimeSeconds(secs);
      setTimeTenths(tenths || '0');
      setStrokeRate(existingPiece.strokeRate?.toString() || '');
      setDistance(existingPiece.distance?.toString() || '');
      setNotes(existingPiece.notes || '');
    } else {
      // Clear form for new piece
      setTimeMinutes('');
      setTimeSeconds('');
      setTimeTenths('');
      setStrokeRate('');
      setDistance('');
      setNotes('');
    }
    setActivePiece(pieceNum);
  };

  const isPieceSaved = (pieceNum) => pieces.some((p) => p.number === pieceNum);

  return (
    <div className="bg-void-elevated border border-white/[0.06] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <span className="font-display text-sm font-semibold text-text-primary uppercase tracking-wider">
            Workout Entry
          </span>
          {workoutTemplate && (
            <span className="text-xs text-blade-blue font-mono">
              {workoutTemplate}
            </span>
          )}
        </div>
      </div>

      {/* Piece selector tabs */}
      <div className="flex items-center gap-1 px-4 py-3 border-b border-white/[0.06] overflow-x-auto">
        {Array.from({ length: totalPieces }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            onClick={() => handlePieceSelect(num)}
            className={`relative flex-shrink-0 w-9 h-9 rounded-md font-mono text-sm font-medium transition-all duration-100 ${
              num === activePiece
                ? 'bg-blade-blue text-void-deep'
                : isPieceSaved(num)
                ? 'bg-white/[0.04] text-text-secondary border border-white/[0.06]'
                : 'bg-transparent text-text-muted hover:bg-white/[0.04] hover:text-text-secondary'
            }`}
          >
            {num}
            {isPieceSaved(num) && num !== activePiece && (
              <Check size={10} className="absolute -top-1 -right-1 text-success" />
            )}
          </button>
        ))}
        <button
          onClick={() => setActivePiece(pieces.length + 1)}
          className="flex-shrink-0 w-9 h-9 rounded-md text-text-muted hover:text-text-secondary hover:bg-white/[0.04] transition-colors duration-100"
        >
          <Plus size={16} className="mx-auto" />
        </button>
      </div>

      {/* Input area */}
      <div className="p-4 space-y-4">
        {/* Time input row */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-text-muted uppercase tracking-wider w-12">
            Time
          </label>
          <div className="flex items-center gap-1 flex-1">
            {/* Minutes */}
            <input
              ref={minutesRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              value={timeMinutes}
              onChange={(e) => handleMinutesChange(e.target.value)}
              className="w-12 h-11 bg-void-surface border border-white/[0.08] rounded-md text-center font-mono text-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/50 focus:shadow-focus-blue transition-all duration-100"
            />
            <span className="text-text-muted font-mono text-lg">:</span>
            {/* Seconds */}
            <input
              ref={secondsRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="00"
              value={timeSeconds}
              onChange={(e) => handleSecondsChange(e.target.value)}
              className="w-14 h-11 bg-void-surface border border-white/[0.08] rounded-md text-center font-mono text-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/50 focus:shadow-focus-blue transition-all duration-100"
            />
            <span className="text-text-muted font-mono text-lg">.</span>
            {/* Tenths */}
            <input
              ref={tenthsRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              value={timeTenths}
              onChange={(e) => handleTenthsChange(e.target.value)}
              className="w-10 h-11 bg-void-surface border border-white/[0.08] rounded-md text-center font-mono text-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/50 focus:shadow-focus-blue transition-all duration-100"
            />
          </div>
        </div>

        {/* Stroke rate input row */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-text-muted uppercase tracking-wider w-12">
            S/M
          </label>
          <input
            ref={strokeRateRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="--"
            value={strokeRate}
            onChange={(e) => handleStrokeRateChange(e.target.value)}
            className="w-16 h-11 bg-void-surface border border-white/[0.08] rounded-md text-center font-mono text-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/50 focus:shadow-focus-blue transition-all duration-100"
          />
          <span className="text-xs text-text-muted">strokes/min</span>
        </div>

        {/* Distance input (optional) */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-text-muted uppercase tracking-wider w-12">
            Dist
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="--"
            value={distance}
            onChange={(e) => setDistance(e.target.value.replace(/\D/g, ''))}
            className="w-20 h-11 bg-void-surface border border-white/[0.08] rounded-md text-center font-mono text-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/50 focus:shadow-focus-blue transition-all duration-100"
          />
          <span className="text-xs text-text-muted">meters</span>
        </div>

        {/* Notes (optional) */}
        <div className="flex items-start gap-3">
          <label className="text-xs text-text-muted uppercase tracking-wider w-12 pt-3">
            Notes
          </label>
          <input
            type="text"
            placeholder="Quick note..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="flex-1 h-11 px-3 bg-void-surface border border-white/[0.08] rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/50 focus:shadow-focus-blue transition-all duration-100"
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={isSaving || !formatTime()}
          className={`w-full h-12 rounded-lg font-semibold text-sm uppercase tracking-wider transition-all duration-150 ${
            isSaving || !formatTime()
              ? 'bg-white/[0.04] text-text-disabled cursor-not-allowed'
              : 'bg-blade-blue text-void-deep hover:shadow-glow-blue active:scale-[0.98]'
          }`}
        >
          {isSaving ? 'Saving...' : isPieceSaved(activePiece) ? 'Update Piece' : 'Save Piece'}
        </button>
      </div>

      {/* Saved pieces list */}
      {pieces.length > 0 && (
        <div className="border-t border-white/[0.06]">
          <div className="px-4 py-2 bg-void-surface/50">
            <span className="text-xs text-text-muted uppercase tracking-wider">
              Saved Pieces
            </span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {pieces.map((piece) => (
              <div
                key={piece.number}
                className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors duration-100"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded bg-success/20 text-success text-xs font-mono flex items-center justify-center">
                    {piece.number}
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-text-primary text-sm">
                      {piece.time}
                    </span>
                    {piece.strokeRate && (
                      <span className="text-xs text-text-secondary">
                        @ {piece.strokeRate} s/m
                      </span>
                    )}
                    {piece.distance && (
                      <span className="text-xs text-text-muted">
                        {piece.distance}m
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-success" />
                  {onDeletePiece && (
                    <button
                      onClick={() => onDeletePiece(piece.number)}
                      className="p-1 text-text-muted hover:text-danger-red transition-colors duration-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkoutEntry;
