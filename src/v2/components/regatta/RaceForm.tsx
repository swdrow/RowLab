import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import type { Race, RaceFormData } from '../../types/regatta';
import { getBoatClasses } from '../../utils/marginCalculations';

const raceSchema = z.object({
  eventName: z.string().min(1, 'Race name is required').max(100),
  boatClass: z.string().min(1, 'Boat class is required'),
  distanceMeters: z.number().int().positive().default(2000),
  isHeadRace: z.boolean().default(false),
  scheduledTime: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof raceSchema>;

type RaceFormProps = {
  race?: Race;
  eventName?: string; // Pre-fill from parent event
  regattaDate: string; // For default time
  onSubmit: (data: RaceFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
};

const DISTANCES = [
  { value: 2000, label: '2000m' },
  { value: 1500, label: '1500m' },
  { value: 1000, label: '1000m' },
  { value: 5000, label: '5000m (Head)' },
  { value: 6000, label: '6000m (Head)' },
];

export function RaceForm({
  race,
  eventName,
  regattaDate,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: RaceFormProps) {
  const isEditing = !!race;
  const boatClasses = getBoatClasses();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(raceSchema),
    defaultValues: {
      eventName: race?.eventName || eventName || '',
      boatClass: race?.boatClass || '',
      distanceMeters: race?.distanceMeters || 2000,
      isHeadRace: race?.isHeadRace || false,
      scheduledTime: race?.scheduledTime
        ? format(new Date(race.scheduledTime), "yyyy-MM-dd'T'HH:mm")
        : null,
    },
  });

  const isHeadRace = watch('isHeadRace');

  const onFormSubmit = (data: FormValues) => {
    onSubmit(data as RaceFormData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Race name (typically "Heat 1", "Final A", etc.) */}
      <div>
        <label className="block text-sm font-medium text-txt-primary mb-1">
          Race Name *
        </label>
        <input
          {...register('eventName')}
          className="w-full px-3 py-2 bg-ink-well border border-ink-border rounded-lg
                   text-txt-primary placeholder:text-txt-tertiary
                   focus:outline-none focus:ring-2 focus:ring-focus-ring"
          placeholder="e.g., Heat 1, Final A, Time Trial"
        />
        {errors.eventName && (
          <p className="mt-1 text-sm text-data-poor">{errors.eventName.message}</p>
        )}
      </div>

      {/* Boat class */}
      <div>
        <label className="block text-sm font-medium text-txt-primary mb-1">
          Boat Class *
        </label>
        <select
          {...register('boatClass')}
          className="w-full px-3 py-2 bg-ink-well border border-ink-border rounded-lg
                   text-txt-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
        >
          <option value="">Select boat class</option>
          {boatClasses.map(bc => (
            <option key={bc.value} value={bc.value}>{bc.label}</option>
          ))}
        </select>
        {errors.boatClass && (
          <p className="mt-1 text-sm text-data-poor">{errors.boatClass.message}</p>
        )}
      </div>

      {/* Race type and distance */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('isHeadRace')}
              className="w-4 h-4 rounded border-ink-border text-data-good
                       focus:ring-focus-ring"
            />
            <span className="text-sm font-medium text-txt-primary">Head Race</span>
          </label>
          <p className="text-xs text-txt-tertiary mt-1">
            Time-trial format (boats start separately)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-txt-primary mb-1">
            Distance
          </label>
          <select
            {...register('distanceMeters', { valueAsNumber: true })}
            className="w-full px-3 py-2 bg-ink-well border border-ink-border rounded-lg
                     text-txt-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
          >
            {DISTANCES.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Scheduled time */}
      <div>
        <label className="block text-sm font-medium text-txt-primary mb-1">
          Scheduled Time
        </label>
        <input
          type="datetime-local"
          {...register('scheduledTime')}
          className="w-full px-3 py-2 bg-ink-well border border-ink-border rounded-lg
                   text-txt-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
        />
        <p className="text-xs text-txt-tertiary mt-1">
          Used for race day schedule and warmup calculations
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-txt-secondary
                   bg-ink-raised rounded-lg hover:bg-ink-hover transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white
                   bg-data-good rounded-lg hover:bg-data-good-hover
                   disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Saving...' : isEditing ? 'Save' : 'Add Race'}
        </button>
      </div>
    </form>
  );
}
