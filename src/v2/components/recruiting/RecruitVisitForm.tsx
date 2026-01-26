import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateRecruitVisit, useUpdateRecruitVisit } from '@v2/hooks/useRecruitVisits';
import { useAthletes } from '@v2/hooks/useAthletes';
import { VisitScheduleEditor } from './VisitScheduleEditor';
import type { RecruitVisit, CreateRecruitVisitInput, ScheduleType } from '@v2/types/recruiting';

// Zod schema
const recruitVisitSchema = z.object({
  recruitName: z.string().min(1, 'Recruit name is required'),
  recruitEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  recruitPhone: z.string().optional(),
  recruitSchool: z.string().optional(),
  recruitGradYear: z.number().min(2020).max(2035).optional().nullable(),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  hostAthleteId: z.string().optional(),
  scheduleType: z.enum(['pdf', 'richtext']),
  scheduleContent: z.string().optional(),
  schedulePdfUrl: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof recruitVisitSchema>;

interface RecruitVisitFormProps {
  visit?: RecruitVisit; // For editing
  onSuccess?: (visit: RecruitVisit) => void;
  onCancel?: () => void;
}

export function RecruitVisitForm({ visit, onSuccess, onCancel }: RecruitVisitFormProps) {
  const { createVisitAsync } = useCreateRecruitVisit();
  const { updateVisitAsync } = useUpdateRecruitVisit();
  const { athletes } = useAthletes();

  const isEditing = !!visit;

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(recruitVisitSchema),
    defaultValues: {
      recruitName: visit?.recruitName || '',
      recruitEmail: visit?.recruitEmail || '',
      recruitPhone: visit?.recruitPhone || '',
      recruitSchool: visit?.recruitSchool || '',
      recruitGradYear: visit?.recruitGradYear || null,
      date: visit?.date?.split('T')[0] || new Date().toISOString().split('T')[0],
      startTime: visit?.startTime || '09:00',
      endTime: visit?.endTime || '17:00',
      hostAthleteId: visit?.hostAthleteId || '',
      scheduleType: visit?.scheduleType || 'richtext',
      scheduleContent: visit?.scheduleContent || '',
      schedulePdfUrl: visit?.schedulePdfUrl || '',
      notes: visit?.notes || '',
    },
  });

  const scheduleType = watch('scheduleType');

  const onSubmit = async (data: FormData) => {
    const input: CreateRecruitVisitInput = {
      ...data,
      recruitGradYear: data.recruitGradYear || undefined,
      hostAthleteId: data.hostAthleteId || undefined,
      recruitEmail: data.recruitEmail || undefined,
      recruitPhone: data.recruitPhone || undefined,
      recruitSchool: data.recruitSchool || undefined,
      scheduleContent: data.scheduleContent || undefined,
      schedulePdfUrl: data.schedulePdfUrl || undefined,
      notes: data.notes || undefined,
    };

    try {
      let result;
      if (isEditing) {
        result = await updateVisitAsync({ visitId: visit.id, input });
      } else {
        result = await createVisitAsync(input);
      }
      onSuccess?.(result);
    } catch (error) {
      // Error handled by mutation
      console.error('Failed to save recruit visit:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Recruit Info Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-txt-primary">Recruit Information</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-txt-secondary mb-1">
              Name *
            </label>
            <input
              {...register('recruitName')}
              className="w-full px-3 py-2 bg-surface border border-bdr rounded-lg text-txt-primary focus:outline-none focus:border-interactive-primary"
              placeholder="Full name"
            />
            {errors.recruitName && (
              <p className="text-sm text-status-error mt-1">{errors.recruitName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-txt-secondary mb-1">
              Email
            </label>
            <input
              {...register('recruitEmail')}
              type="email"
              className="w-full px-3 py-2 bg-surface border border-bdr rounded-lg text-txt-primary focus:outline-none focus:border-interactive-primary"
              placeholder="email@school.edu"
            />
            {errors.recruitEmail && (
              <p className="text-sm text-status-error mt-1">{errors.recruitEmail.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-txt-secondary mb-1">
              Phone
            </label>
            <input
              {...register('recruitPhone')}
              className="w-full px-3 py-2 bg-surface border border-bdr rounded-lg text-txt-primary focus:outline-none focus:border-interactive-primary"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-txt-secondary mb-1">
              Current School
            </label>
            <input
              {...register('recruitSchool')}
              className="w-full px-3 py-2 bg-surface border border-bdr rounded-lg text-txt-primary focus:outline-none focus:border-interactive-primary"
              placeholder="High school name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-txt-secondary mb-1">
              Graduation Year
            </label>
            <input
              {...register('recruitGradYear', {
                valueAsNumber: true,
                setValueAs: (v) => v === '' || v === null ? null : Number(v)
              })}
              type="number"
              className="w-full px-3 py-2 bg-surface border border-bdr rounded-lg text-txt-primary focus:outline-none focus:border-interactive-primary"
              placeholder="2026"
            />
            {errors.recruitGradYear && (
              <p className="text-sm text-status-error mt-1">{errors.recruitGradYear.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Visit Details Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-txt-primary">Visit Details</h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-txt-secondary mb-1">
              Date *
            </label>
            <input
              {...register('date')}
              type="date"
              className="w-full px-3 py-2 bg-surface border border-bdr rounded-lg text-txt-primary focus:outline-none focus:border-interactive-primary"
            />
            {errors.date && (
              <p className="text-sm text-status-error mt-1">{errors.date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-txt-secondary mb-1">
              Start Time *
            </label>
            <input
              {...register('startTime')}
              type="time"
              className="w-full px-3 py-2 bg-surface border border-bdr rounded-lg text-txt-primary focus:outline-none focus:border-interactive-primary"
            />
            {errors.startTime && (
              <p className="text-sm text-status-error mt-1">{errors.startTime.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-txt-secondary mb-1">
              End Time *
            </label>
            <input
              {...register('endTime')}
              type="time"
              className="w-full px-3 py-2 bg-surface border border-bdr rounded-lg text-txt-primary focus:outline-none focus:border-interactive-primary"
            />
            {errors.endTime && (
              <p className="text-sm text-status-error mt-1">{errors.endTime.message}</p>
            )}
          </div>
        </div>

        {/* Host Athlete Selector */}
        <div>
          <label className="block text-sm font-medium text-txt-secondary mb-1">
            Host Athlete
          </label>
          <select
            {...register('hostAthleteId')}
            className="w-full px-3 py-2 bg-surface border border-bdr rounded-lg text-txt-primary focus:outline-none focus:border-interactive-primary"
          >
            <option value="">Select host athlete (optional)</option>
            {athletes?.map(athlete => (
              <option key={athlete.id} value={athlete.id}>
                {athlete.firstName} {athlete.lastName}
              </option>
            ))}
          </select>
          <p className="text-xs text-txt-tertiary mt-1">
            The host will see this visit in their dashboard.
          </p>
        </div>
      </div>

      {/* Schedule Content Section */}
      <Controller
        name="scheduleType"
        control={control}
        render={({ field: typeField }) => (
          <VisitScheduleEditor
            scheduleType={typeField.value as ScheduleType}
            scheduleContent={watch('scheduleContent')}
            schedulePdfUrl={watch('schedulePdfUrl')}
            onTypeChange={typeField.onChange}
            onContentChange={(content) => setValue('scheduleContent', content)}
            onPdfChange={(url) => setValue('schedulePdfUrl', url || '')}
          />
        )}
      />

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-txt-secondary mb-1">
          Internal Notes
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full px-3 py-2 bg-surface border border-bdr rounded-lg text-txt-primary focus:outline-none focus:border-interactive-primary resize-none"
          placeholder="Notes for coaching staff (not visible to recruit)"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t border-bdr">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-txt-secondary hover:text-txt-primary transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-interactive-primary text-white rounded-lg hover:bg-interactive-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Visit' : 'Create Visit'}
        </button>
      </div>
    </form>
  );
}
