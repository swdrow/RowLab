import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Event, EventFormData } from '../../types/regatta';

const eventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(100),
  category: z.string().max(50).nullable().optional(),
  scheduledDay: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().default(0),
});

type FormValues = z.infer<typeof eventSchema>;

// Common event categories in collegiate rowing
const EVENT_CATEGORIES = [
  'Varsity 8+',
  '2V8+',
  'JV8+',
  '3V8+',
  'Varsity 4+',
  '2V4+',
  'JV4+',
  'Varsity 4-',
  'Varsity 2-',
  'Varsity 1x',
  'Novice 8+',
  'Lightweight 8+',
  'Lightweight 4+',
  'Custom',
];

type EventFormProps = {
  event?: Event;
  regattaDays?: number; // Number of days for multi-day regattas
  onSubmit: (data: EventFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
};

export function EventForm({
  event,
  regattaDays = 1,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: EventFormProps) {
  const isEditing = !!event;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: event?.name || '',
      category: event?.category || null,
      scheduledDay: event?.scheduledDay || 1,
      sortOrder: event?.sortOrder || 0,
    },
  });

  const selectedCategory = watch('category');

  const handleCategorySelect = (category: string) => {
    if (category === 'Custom') {
      setValue('category', null);
      setValue('name', '');
    } else {
      setValue('category', category);
      setValue('name', category);
    }
  };

  const onFormSubmit = (data: FormValues) => {
    onSubmit(data as EventFormData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Category quick select */}
      <div>
        <label className="block text-sm font-medium text-txt-primary mb-2">
          Event Category
        </label>
        <div className="flex flex-wrap gap-2">
          {EVENT_CATEGORIES.slice(0, 10).map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategorySelect(cat)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                selectedCategory === cat || (watch('name') === cat && selectedCategory !== 'Custom')
                  ? 'bg-data-good text-white'
                  : 'bg-ink-raised text-txt-secondary hover:bg-ink-hover'
              }`}
            >
              {cat}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleCategorySelect('Custom')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              !selectedCategory && !EVENT_CATEGORIES.includes(watch('name'))
                ? 'bg-data-good text-white'
                : 'bg-ink-raised text-txt-secondary hover:bg-ink-hover'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Event name (editable for custom) */}
      <div>
        <label className="block text-sm font-medium text-txt-primary mb-1">
          Event Name *
        </label>
        <input
          {...register('name')}
          className="w-full px-3 py-2 bg-ink-well border border-ink-border rounded-lg
                   text-txt-primary placeholder:text-txt-tertiary
                   focus:outline-none focus:ring-2 focus:ring-focus-ring"
          placeholder="e.g., Varsity 8+"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-data-poor">{errors.name.message}</p>
        )}
      </div>

      {/* Scheduled day for multi-day regattas */}
      {regattaDays > 1 && (
        <div>
          <label className="block text-sm font-medium text-txt-primary mb-1">
            Race Day
          </label>
          <select
            {...register('scheduledDay', { valueAsNumber: true })}
            className="w-full px-3 py-2 bg-ink-well border border-ink-border rounded-lg
                     text-txt-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
          >
            {Array.from({ length: regattaDays }, (_, i) => i + 1).map(day => (
              <option key={day} value={day}>Day {day}</option>
            ))}
          </select>
        </div>
      )}

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
          {isSubmitting ? 'Saving...' : isEditing ? 'Save' : 'Add Event'}
        </button>
      </div>
    </form>
  );
}
