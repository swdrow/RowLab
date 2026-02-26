/**
 * WorkoutFormModal -- Portal-based modal for creating a planned workout.
 *
 * Form fields: title, type, date, duration, distance, intensity, notes.
 * Uses addWorkoutToPlan mutation. Closes on success.
 * Rendered via React portal for proper z-index stacking.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { addWorkoutToPlan, trainingKeys } from '../api';
import type { WorkoutType, Intensity, CreatePlannedWorkoutInput } from '../types';
import { Button } from '@/components/ui/Button';
import { formatDateForInput } from '@/lib/format';
import { SPRING_GENTLE } from '@/lib/animations';
import { IconX } from '@/components/icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WorkoutFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  planId?: string;
  initialDate?: Date;
}

const WORKOUT_TYPES: { value: WorkoutType; label: string }[] = [
  { value: 'erg', label: 'Erg' },
  { value: 'row', label: 'On-Water' },
  { value: 'strength', label: 'Strength' },
  { value: 'cross_train', label: 'Cross Training' },
  { value: 'rest', label: 'Rest Day' },
];

const INTENSITIES: { value: Intensity; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'hard', label: 'Hard' },
  { value: 'max', label: 'Max' },
];

// ---------------------------------------------------------------------------
// WorkoutFormModal
// ---------------------------------------------------------------------------

export function WorkoutFormModal({
  isOpen,
  onClose,
  teamId,
  planId,
  initialDate,
}: WorkoutFormModalProps) {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <ModalOverlay onClose={onClose}>
          <WorkoutForm
            teamId={teamId}
            planId={planId}
            initialDate={initialDate}
            onClose={onClose}
          />
        </ModalOverlay>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// Modal overlay
// ---------------------------------------------------------------------------

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  // Prevent body scroll while open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  return (
    <motion.div
      ref={overlayRef}
      onClick={handleBackdropClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={SPRING_GENTLE}
        className="w-full max-w-lg"
        role="dialog"
        aria-modal="true"
        aria-label="Create Workout"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Workout form
// ---------------------------------------------------------------------------

function WorkoutForm({
  teamId: _teamId,
  planId,
  initialDate,
  onClose,
}: {
  teamId: string;
  planId?: string;
  initialDate?: Date;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const titleRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<WorkoutType>('erg');
  const [date, setDate] = useState(
    initialDate ? formatDateForInput(initialDate) : formatDateForInput(new Date())
  );
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [intensity, setIntensity] = useState<Intensity | ''>('');
  const [notes, setNotes] = useState('');

  // Auto-focus title field
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const mutation = useMutation({
    mutationFn: (input: CreatePlannedWorkoutInput) => {
      // Use provided planId or we need at least one plan
      const targetPlanId = planId;
      if (!targetPlanId) {
        throw new Error('No plan selected. Create a training plan first.');
      }
      return addWorkoutToPlan(targetPlanId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.plans() });
      queryClient.invalidateQueries({ queryKey: trainingKeys.all });
      onClose();
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;

      const input: CreatePlannedWorkoutInput = {
        name: title.trim(),
        type,
        scheduledDate: date || undefined,
        duration: duration ? Number(duration) * 60 : undefined, // Convert minutes to seconds
        distance: distance ? Number(distance) : undefined,
        intensity: intensity || undefined,
        description: notes.trim() || undefined,
      };

      mutation.mutate(input);
    },
    [title, type, date, duration, distance, intensity, notes, mutation]
  );

  const inputClass =
    'w-full rounded-lg border border-edge-default bg-void-deep/50 px-3 py-2 text-sm text-text-bright placeholder:text-text-faint transition-colors focus:border-accent-teal/50 focus:outline-none';

  const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-text-faint mb-1';

  return (
    <div className="rounded-xl border border-edge-default bg-void-surface shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-edge-default px-5 py-4">
        <h2 className="text-base font-display font-semibold text-text-bright">New Workout</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-text-faint hover:text-text-bright hover:bg-void-overlay transition-colors"
          aria-label="Close"
        >
          <IconX className="h-4 w-4" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Title */}
        <div>
          <label className={labelClass}>Title</label>
          <input
            ref={titleRef}
            type="text"
            placeholder="e.g. 6x1000m intervals"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        {/* Type + Date row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as WorkoutType)}
              className={inputClass}
            >
              {WORKOUT_TYPES.map((wt) => (
                <option key={wt.value} value={wt.value}>
                  {wt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>

        {/* Duration + Distance row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Duration (min)</label>
            <input
              type="number"
              placeholder="60"
              min="0"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label className={labelClass}>Distance (meters)</label>
            <input
              type="number"
              placeholder="6000"
              min="0"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>

        {/* Intensity */}
        <div>
          <label className={labelClass}>Intensity</label>
          <div className="flex gap-2">
            {INTENSITIES.map((i) => (
              <button
                key={i.value}
                type="button"
                onClick={() => setIntensity((prev) => (prev === i.value ? '' : i.value))}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  intensity === i.value
                    ? 'bg-accent-teal text-void-deep shadow-sm'
                    : 'bg-void-raised text-text-dim hover:text-text-bright hover:bg-void-overlay border border-edge-default'
                }`}
              >
                {i.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            placeholder="Workout details, splits, instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Error */}
        {mutation.isError && (
          <p className="text-xs text-data-poor">
            {mutation.error instanceof Error ? mutation.error.message : 'Failed to create workout.'}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={mutation.isPending}>
            Create Workout
          </Button>
        </div>
      </form>
    </div>
  );
}
