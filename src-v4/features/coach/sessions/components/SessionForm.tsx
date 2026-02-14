/**
 * SessionForm - Create/edit training sessions with react-hook-form + zod.
 *
 * Two-step form:
 * 1. Session metadata (name, type, date, time, notes)
 * 2. Pieces configuration (warmup/main/cooldown segments)
 *
 * Supports both create and edit modes via optional `session` prop.
 */
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';

import type { TrainingSession, SessionType, PieceSegment } from '../types';
import { SESSION_TYPE_CONFIG } from '../types';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const pieceSchema = z.object({
  segment: z.enum(['WARMUP', 'MAIN', 'COOLDOWN']),
  name: z.string().min(1, 'Piece name is required'),
  description: z.string().optional(),
  distance: z.number().positive().optional(),
  duration: z.number().positive().optional(),
  targetSplit: z.number().positive().optional(),
  targetRate: z.number().positive().optional(),
  notes: z.string().optional(),
});

const sessionSchema = z.object({
  name: z.string().min(1, 'Session name is required'),
  type: z.enum(['ERG', 'ROW', 'LIFT', 'RUN', 'CROSS_TRAIN', 'RECOVERY']),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().optional(),
  athleteVisibility: z.boolean(),
  pieces: z.array(pieceSchema),
});

export type SessionFormData = z.infer<typeof sessionSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SessionFormProps {
  session?: TrainingSession;
  onSubmit: (data: SessionFormData) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SESSION_TYPES: { value: SessionType; label: string }[] = Object.entries(
  SESSION_TYPE_CONFIG
).map(([value, config]) => ({
  value: value as SessionType,
  label: config.label,
}));

const SEGMENTS: { value: PieceSegment; label: string }[] = [
  { value: 'WARMUP', label: 'Warmup' },
  { value: 'MAIN', label: 'Main Set' },
  { value: 'COOLDOWN', label: 'Cooldown' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SessionForm({ session, onSubmit, onCancel, isSubmitting }: SessionFormProps) {
  const [step, setStep] = useState<'metadata' | 'pieces'>('metadata');

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    formState: { errors },
  } = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      name: session?.name ?? '',
      type: session?.type ?? 'ERG',
      date: session?.date?.split('T')[0] ?? new Date().toISOString().split('T')[0],
      startTime: session?.startTime ?? '',
      endTime: session?.endTime ?? '',
      notes: session?.notes ?? '',
      athleteVisibility: session?.athleteVisibility ?? true,
      pieces:
        session?.pieces.map((p) => ({
          segment: p.segment,
          name: p.name,
          description: p.description ?? '',
          distance: p.distance ?? undefined,
          duration: p.duration ?? undefined,
          targetSplit: p.targetSplit ?? undefined,
          targetRate: p.targetRate ?? undefined,
          notes: p.notes ?? '',
        })) ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'pieces',
  });

  const selectedType = watch('type');

  const goToStep2 = async () => {
    const valid = await trigger(['name', 'type', 'date']);
    if (valid) setStep('pieces');
  };

  const addPiece = (segment: PieceSegment = 'MAIN') => {
    append({
      segment,
      name: '',
      description: '',
      distance: undefined,
      duration: undefined,
      targetSplit: undefined,
      targetRate: undefined,
      notes: '',
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Step indicator */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setStep('metadata')}
          className={`flex items-center gap-2 text-sm font-medium transition-colors ${
            step === 'metadata' ? 'text-ink-primary' : 'text-ink-muted hover:text-ink-secondary'
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 'metadata' ? 'bg-accent-copper text-ink-deep' : 'bg-ink-well text-ink-muted'
            }`}
          >
            1
          </span>
          Details
        </button>
        <div className="flex-1 h-px bg-ink-border" />
        <button
          type="button"
          onClick={goToStep2}
          className={`flex items-center gap-2 text-sm font-medium transition-colors ${
            step === 'pieces' ? 'text-ink-primary' : 'text-ink-muted hover:text-ink-secondary'
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 'pieces' ? 'bg-accent-copper text-ink-deep' : 'bg-ink-well text-ink-muted'
            }`}
          >
            2
          </span>
          Pieces
        </button>
      </div>

      {/* Step 1: Metadata */}
      {step === 'metadata' && (
        <div className="space-y-4">
          {/* Session Type */}
          <div>
            <label className="block text-sm text-ink-secondary mb-2">Session Type</label>
            <div className="grid grid-cols-3 gap-2">
              {SESSION_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center justify-center gap-1.5 p-2.5 rounded-lg border cursor-pointer transition-all text-sm font-medium ${
                    selectedType === type.value
                      ? 'border-accent-copper bg-accent-copper/10 text-ink-primary'
                      : 'border-ink-border bg-ink-base text-ink-secondary hover:border-ink-muted'
                  }`}
                >
                  <input
                    type="radio"
                    {...register('type')}
                    value={type.value}
                    className="sr-only"
                  />
                  {type.label}
                </label>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm text-ink-secondary mb-1">Session Name</label>
            <input
              {...register('name')}
              placeholder="e.g. Morning Erg"
              className="w-full px-3 py-2 rounded-lg bg-ink-base border border-ink-border text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-accent-copper transition-colors"
            />
            {errors.name && <p className="text-data-poor text-sm mt-1">{errors.name.message}</p>}
          </div>

          {/* Date + Times */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-ink-secondary mb-1">Date</label>
              <input
                type="date"
                {...register('date')}
                className="w-full px-3 py-2 rounded-lg bg-ink-base border border-ink-border text-ink-primary focus:outline-none focus:border-accent-copper transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-ink-secondary mb-1">Start</label>
              <input
                type="time"
                {...register('startTime')}
                className="w-full px-3 py-2 rounded-lg bg-ink-base border border-ink-border text-ink-primary focus:outline-none focus:border-accent-copper transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-ink-secondary mb-1">End</label>
              <input
                type="time"
                {...register('endTime')}
                className="w-full px-3 py-2 rounded-lg bg-ink-base border border-ink-border text-ink-primary focus:outline-none focus:border-accent-copper transition-colors"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-ink-secondary mb-1">Notes</label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Optional notes..."
              className="w-full px-3 py-2 rounded-lg bg-ink-base border border-ink-border text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-accent-copper resize-none transition-colors"
            />
          </div>

          {/* Visibility */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('athleteVisibility')}
              className="w-4 h-4 rounded border-ink-border text-accent-copper focus:ring-accent-copper"
            />
            <span className="text-sm text-ink-primary">Athletes can see this session</span>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-ink-border">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-lg text-sm font-medium text-ink-secondary hover:text-ink-body hover:bg-ink-hover transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={goToStep2}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-copper text-ink-deep text-sm font-medium hover:bg-accent-copper-hover transition-colors"
            >
              Next: Pieces
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Pieces */}
      {step === 'pieces' && (
        <div className="space-y-4">
          {fields.length === 0 ? (
            <div className="text-center py-8 text-ink-secondary text-sm">
              <p>No pieces added yet. Add warmup, main set, or cooldown pieces.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="bg-ink-raised border border-ink-border rounded-lg p-3 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <select
                      {...register(`pieces.${index}.segment`)}
                      className="text-xs font-medium bg-ink-well border border-ink-border rounded px-2 py-1 text-ink-primary focus:outline-none focus:border-accent-copper"
                    >
                      {SEGMENTS.map((seg) => (
                        <option key={seg.value} value={seg.value}>
                          {seg.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-1 text-ink-muted hover:text-data-poor transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <input
                    {...register(`pieces.${index}.name`)}
                    placeholder="Piece name (e.g. 2k test)"
                    className="w-full px-3 py-1.5 rounded-md bg-ink-base border border-ink-border text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-accent-copper transition-colors"
                  />
                  {errors.pieces?.[index]?.name && (
                    <p className="text-data-poor text-xs">{errors.pieces[index]?.name?.message}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-ink-muted mb-0.5">Distance (m)</label>
                      <input
                        type="number"
                        {...register(`pieces.${index}.distance`, { valueAsNumber: true })}
                        placeholder="2000"
                        className="w-full px-2 py-1 rounded-md bg-ink-base border border-ink-border text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-accent-copper transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-ink-muted mb-0.5">Duration (sec)</label>
                      <input
                        type="number"
                        {...register(`pieces.${index}.duration`, { valueAsNumber: true })}
                        placeholder="480"
                        className="w-full px-2 py-1 rounded-md bg-ink-base border border-ink-border text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-accent-copper transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-ink-muted mb-0.5">
                        Target Split (s/500m)
                      </label>
                      <input
                        type="number"
                        {...register(`pieces.${index}.targetSplit`, { valueAsNumber: true })}
                        placeholder="115"
                        className="w-full px-2 py-1 rounded-md bg-ink-base border border-ink-border text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-accent-copper transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-ink-muted mb-0.5">Target Rate</label>
                      <input
                        type="number"
                        {...register(`pieces.${index}.targetRate`, { valueAsNumber: true })}
                        placeholder="28"
                        className="w-full px-2 py-1 rounded-md bg-ink-base border border-ink-border text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-accent-copper transition-colors"
                      />
                    </div>
                  </div>

                  <input
                    {...register(`pieces.${index}.notes`)}
                    placeholder="Notes for this piece..."
                    className="w-full px-3 py-1.5 rounded-md bg-ink-base border border-ink-border text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-accent-copper transition-colors"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Add piece buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => addPiece('WARMUP')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-ink-secondary hover:text-ink-primary hover:bg-ink-hover border border-ink-border transition-colors"
            >
              <Plus size={12} />
              Warmup
            </button>
            <button
              type="button"
              onClick={() => addPiece('MAIN')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-accent-copper hover:text-accent-copper-hover hover:bg-accent-copper/10 border border-accent-copper/30 transition-colors"
            >
              <Plus size={12} />
              Main
            </button>
            <button
              type="button"
              onClick={() => addPiece('COOLDOWN')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-ink-secondary hover:text-ink-primary hover:bg-ink-hover border border-ink-border transition-colors"
            >
              <Plus size={12} />
              Cooldown
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-ink-border">
            <button
              type="button"
              onClick={() => setStep('metadata')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-ink-secondary hover:text-ink-body hover:bg-ink-hover transition-colors"
            >
              <ChevronLeft size={16} />
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-accent-copper text-ink-deep text-sm font-medium hover:bg-accent-copper-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Saving...' : session ? 'Update Session' : 'Create Session'}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
