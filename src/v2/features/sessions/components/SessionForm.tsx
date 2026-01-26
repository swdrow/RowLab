import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useCreateSession } from '../../../hooks/useSessions';
import { RecurrenceEditor } from './RecurrenceEditor';
import { PieceEditor } from './PieceEditor';
import type { SessionType, CreateSessionInput } from '../../../types/session';

const SESSION_TYPES: { value: SessionType; label: string }[] = [
  { value: 'ERG', label: 'Erg' },
  { value: 'ROW', label: 'Row (On Water)' },
  { value: 'LIFT', label: 'Lift' },
  { value: 'RUN', label: 'Run' },
  { value: 'CROSS_TRAIN', label: 'Cross-Train' },
  { value: 'RECOVERY', label: 'Recovery/Stretch' },
];

const sessionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['ERG', 'ROW', 'LIFT', 'RUN', 'CROSS_TRAIN', 'RECOVERY']),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string(),
  endTime: z.string(),
  recurrenceRule: z.string().optional(),
  notes: z.string(),
  athleteVisibility: z.boolean(),
  pieces: z.array(
    z.object({
      segment: z.enum(['WARMUP', 'MAIN', 'COOLDOWN']),
      name: z.string(),
      description: z.string().optional(),
      order: z.number(),
      distance: z.number().optional(),
      duration: z.number().optional(),
      targetSplit: z.number().optional(),
      targetRate: z.number().optional(),
      targetWatts: z.number().optional(),
      targetHRZone: z.string().optional(),
      targetRPE: z.number().optional(),
      notes: z.string(),
      boatClass: z.string().optional(),
      sets: z.number().optional(),
      reps: z.number().optional(),
    })
  ),
});

type SessionFormData = z.infer<typeof sessionSchema>;

interface SessionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SessionForm({ onSuccess, onCancel }: SessionFormProps) {
  const navigate = useNavigate();
  const { createSessionAsync } = useCreateSession();

  const methods = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      name: '',
      type: 'ERG',
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      recurrenceRule: undefined,
      notes: '',
      athleteVisibility: true,
      pieces: [],
    },
  });

  const { register, handleSubmit, setValue, control, formState: { errors, isSubmitting } } = methods;
  const sessionType = useWatch({ control, name: 'type' }) || 'ERG';
  const sessionDate = useWatch({ control, name: 'date' }) || new Date().toISOString().split('T')[0];
  const recurrenceRule = useWatch({ control, name: 'recurrenceRule' });

  const onSubmit = async (data: SessionFormData) => {
    try {
      const input: CreateSessionInput = {
        ...data,
        pieces: data.pieces.map((piece, index) => ({
          ...piece,
          order: index,
          duration: piece.duration ? piece.duration * 60 : undefined, // Convert minutes to seconds
        })),
      };

      const session = await createSessionAsync(input);
      onSuccess?.();
      navigate(`/app/training/sessions/${session.id}`);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="font-medium text-txt-primary">Session Details</h3>

          {/* Name */}
          <div>
            <label className="block text-sm text-txt-secondary mb-1">Session Name</label>
            <input
              {...register('name')}
              placeholder="e.g., Morning Erg, Afternoon Row"
              className="w-full px-3 py-2 rounded-lg bg-surface-default border border-bdr-default
                text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent-primary"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm text-txt-secondary mb-1">Session Type</label>
            <select
              {...register('type')}
              className="w-full px-3 py-2 rounded-lg bg-surface-default border border-bdr-default
                text-txt-primary focus:outline-none focus:border-accent-primary"
            >
              {SESSION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-txt-secondary mb-1">Date</label>
              <input
                type="date"
                {...register('date')}
                className="w-full px-3 py-2 rounded-lg bg-surface-default border border-bdr-default
                  text-txt-primary focus:outline-none focus:border-accent-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-txt-secondary mb-1">Start Time</label>
              <input
                type="time"
                {...register('startTime')}
                className="w-full px-3 py-2 rounded-lg bg-surface-default border border-bdr-default
                  text-txt-primary focus:outline-none focus:border-accent-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-txt-secondary mb-1">End Time</label>
              <input
                type="time"
                {...register('endTime')}
                className="w-full px-3 py-2 rounded-lg bg-surface-default border border-bdr-default
                  text-txt-primary focus:outline-none focus:border-accent-primary"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-txt-secondary mb-1">Session Notes</label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Any notes for this session..."
              className="w-full px-3 py-2 rounded-lg bg-surface-default border border-bdr-default
                text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent-primary resize-none"
            />
          </div>

          {/* Athlete Visibility */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('athleteVisibility')}
              className="w-4 h-4 rounded border-bdr-default text-accent-primary focus:ring-accent-primary"
            />
            <span className="text-txt-primary">Athletes can see session details before it starts</span>
          </label>
        </div>

        {/* Recurrence */}
        <div className="space-y-4 pt-4 border-t border-bdr-default">
          <h3 className="font-medium text-txt-primary">Recurrence</h3>
          <RecurrenceEditor
            value={recurrenceRule}
            onChange={(rrule) => setValue('recurrenceRule', rrule)}
            startDate={sessionDate ? new Date(sessionDate) : new Date()}
          />
        </div>

        {/* Pieces */}
        <div className="space-y-4 pt-4 border-t border-bdr-default">
          <h3 className="font-medium text-txt-primary">Pieces</h3>
          <PieceEditor sessionType={sessionType} />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-bdr-default">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-bdr-default text-txt-secondary
                hover:text-txt-primary hover:border-bdr-focus transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-accent-primary text-white font-medium
              hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Creating...' : 'Create Session'}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
