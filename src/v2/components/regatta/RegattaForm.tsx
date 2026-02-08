import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import type { Regatta, RegattaFormData, CourseType } from '../../types/regatta';

const regattaSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  location: z.string().max(200).nullable().optional(),
  date: z.string().min(1, 'Date is required'),
  endDate: z.string().nullable().optional(),
  host: z.string().max(100).nullable().optional(),
  venueType: z.string().max(50).nullable().optional(),
  courseType: z.enum(['2000m', '1500m', 'head', 'custom']).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  externalUrl: z.string().url().max(500).nullable().optional().or(z.literal('')),
  teamGoals: z.string().max(1000).nullable().optional(),
  conditions: z
    .object({
      wind: z.string().optional(),
      temperature: z.number().optional(),
      current: z.string().optional(),
    })
    .nullable()
    .optional(),
});

type FormValues = z.infer<typeof regattaSchema>;

type RegattaFormProps = {
  regatta?: Regatta;
  onSubmit: (data: RegattaFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
};

const courseTypes: Array<{ value: CourseType; label: string }> = [
  { value: '2000m', label: '2000m Sprint' },
  { value: '1500m', label: '1500m Sprint' },
  { value: 'head', label: 'Head Race' },
  { value: 'custom', label: 'Custom' },
];

const venueTypes = ['Lake', 'River', 'Canal', 'Bay/Harbor', 'Reservoir'];

export function RegattaForm({
  regatta,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: RegattaFormProps) {
  const isEditing = !!regatta;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(regattaSchema),
    defaultValues: {
      name: regatta?.name || '',
      location: regatta?.location || '',
      date: regatta?.date
        ? format(new Date(regatta.date), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      endDate: regatta?.endDate ? format(new Date(regatta.endDate), 'yyyy-MM-dd') : null,
      host: regatta?.host || '',
      venueType: regatta?.venueType || '',
      courseType: (regatta?.courseType as CourseType) || null,
      description: regatta?.description || '',
      externalUrl: regatta?.externalUrl || '',
      teamGoals: regatta?.teamGoals || '',
      conditions: regatta?.conditions || null,
    },
  });

  const startDate = watch('date');

  const onFormSubmit = (data: FormValues) => {
    const formData: RegattaFormData = {
      ...data,
      externalUrl: data.externalUrl || null,
      conditions: data.conditions || null,
    };
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-txt-secondary uppercase tracking-wide">
          Basic Information
        </h3>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-txt-primary mb-1">Regatta Name *</label>
          <input
            {...register('name')}
            className="w-full px-3 py-2 bg-ink-well border border-ink-border rounded-lg
                     text-txt-primary placeholder:text-txt-tertiary
                     focus:outline-none focus:ring-2 focus:ring-focus-ring focus:border-transparent"
            placeholder="e.g., IRA National Championship"
          />
          {errors.name && <p className="mt-1 text-sm text-data-poor">{errors.name.message}</p>}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-txt-primary mb-1">Start Date *</label>
            <input
              type="date"
              {...register('date')}
              className="w-full px-3 py-2 bg-ink-well border border-ink-border rounded-lg
                       text-txt-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
            />
            {errors.date && <p className="mt-1 text-sm text-data-poor">{errors.date.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-txt-primary mb-1">End Date</label>
            <input
              type="date"
              {...register('endDate')}
              min={startDate}
              className="w-full px-3 py-2 bg-ink-well border border-ink-border rounded-lg
                       text-txt-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-txt-primary mb-1">Location</label>
          <input
            {...register('location')}
            className="w-full px-3 py-2 bg-ink-well border border-ink-border rounded-lg
                     text-txt-primary placeholder:text-txt-tertiary
                     focus:outline-none focus:ring-2 focus:ring-focus-ring"
            placeholder="e.g., Camden, NJ"
          />
        </div>

        {/* Host and Venue */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-txt-primary mb-1">
              Host Organization
            </label>
            <input
              {...register('host')}
              className="w-full px-3 py-2 bg-ink-well border border-ink-border rounded-lg
                       text-txt-primary placeholder:text-txt-tertiary
                       focus:outline-none focus:ring-2 focus:ring-focus-ring"
              placeholder="e.g., USRowing"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-txt-primary mb-1">Venue Type</label>
            <select
              {...register('venueType')}
              className="w-full px-3 py-2 bg-ink-well border border-ink-border rounded-lg
                       text-txt-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
            >
              <option value="">Select venue type</option>
              {venueTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Course Type */}
        <div>
          <label className="block text-sm font-medium text-txt-primary mb-1">Course Type</label>
          <div className="flex gap-2 flex-wrap">
            <Controller
              name="courseType"
              control={control}
              render={({ field }) => (
                <>
                  {courseTypes.map((ct) => (
                    <button
                      key={ct.value}
                      type="button"
                      onClick={() => field.onChange(field.value === ct.value ? null : ct.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        field.value === ct.value
                          ? 'bg-data-good text-white'
                          : 'bg-ink-raised text-txt-secondary hover:bg-ink-hover'
                      }`}
                    >
                      {ct.label}
                    </button>
                  ))}
                </>
              )}
            />
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-txt-secondary uppercase tracking-wide">
          Additional Details
        </h3>

        {/* External URL */}
        <div>
          <label className="block text-sm font-medium text-txt-primary mb-1">
            External Link (RegattaCentral, Row2k)
          </label>
          <input
            {...register('externalUrl')}
            type="url"
            className="w-full px-3 py-2 bg-ink-well border border-ink-border rounded-lg
                     text-txt-primary placeholder:text-txt-tertiary
                     focus:outline-none focus:ring-2 focus:ring-focus-ring"
            placeholder="https://www.regattacentral.com/..."
          />
          {errors.externalUrl && (
            <p className="mt-1 text-sm text-data-poor">{errors.externalUrl.message}</p>
          )}
        </div>

        {/* Team Goals */}
        <div>
          <label className="block text-sm font-medium text-txt-primary mb-1">Team Goals</label>
          <textarea
            {...register('teamGoals')}
            rows={3}
            className="w-full px-3 py-2 bg-ink-well border border-ink-border rounded-lg
                     text-txt-primary placeholder:text-txt-tertiary resize-none
                     focus:outline-none focus:ring-2 focus:ring-focus-ring"
            placeholder="What do you want to achieve at this regatta?"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-txt-primary mb-1">Notes</label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2 bg-ink-well border border-ink-border rounded-lg
                     text-txt-primary placeholder:text-txt-tertiary resize-none
                     focus:outline-none focus:ring-2 focus:ring-focus-ring"
            placeholder="Additional notes about this regatta..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-ink-border">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-txt-secondary hover:text-txt-primary
                   bg-ink-raised rounded-lg hover:bg-ink-hover transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white
                   bg-data-good rounded-lg hover:bg-data-good-hover
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Regatta'}
        </button>
      </div>
    </form>
  );
}
