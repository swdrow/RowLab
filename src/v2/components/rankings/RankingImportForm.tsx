import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import type { RankingSource, ExternalRankingFormData } from '../../types/regatta';
import { getBoatClasses } from '../../utils/marginCalculations';
import { useExternalTeams } from '../../hooks/useTeamRankings';

const rankingSchema = z.object({
  source: z.enum(['row2k', 'usrowing', 'regattacentral', 'manual']),
  externalTeamId: z.string().min(1, 'Team is required'),
  boatClass: z.string().min(1, 'Boat class is required'),
  ranking: z.number().int().positive('Ranking must be a positive number'),
  season: z.string().optional(),
  updatedDate: z.string().min(1, 'Date is required'),
  notes: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof rankingSchema>;

type RankingImportFormProps = {
  onSubmit: (data: ExternalRankingFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
};

const SOURCES: Array<{ value: RankingSource; label: string }> = [
  { value: 'row2k', label: 'Row2k Poll' },
  { value: 'usrowing', label: 'USRowing Rankings' },
  { value: 'regattacentral', label: 'RegattaCentral' },
  { value: 'manual', label: 'Manual Entry' },
];

const SEASONS = [
  { value: 'Spring 2026', label: 'Spring 2026' },
  { value: 'Fall 2025', label: 'Fall 2025' },
  { value: 'Spring 2025', label: 'Spring 2025' },
];

export function RankingImportForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: RankingImportFormProps) {
  const boatClasses = getBoatClasses();
  const { data: externalTeams, isLoading: loadingTeams } = useExternalTeams();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(rankingSchema),
    defaultValues: {
      source: 'manual',
      externalTeamId: '',
      boatClass: '',
      ranking: 1,
      season: SEASONS[0]?.value ?? '',
      updatedDate: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    },
  });


  const onFormSubmit = (data: FormValues) => {
    const formData: ExternalRankingFormData = {
      ...data,
      season: data.season || null,
      notes: data.notes || null,
    };
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Source selector */}
      <div>
        <label className="block text-sm font-medium text-txt-primary mb-2">
          Ranking Source *
        </label>
        <Controller
          name="source"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {SOURCES.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => field.onChange(s.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    field.value === s.value
                      ? 'bg-accent-primary text-white'
                      : 'bg-surface-elevated text-txt-secondary hover:bg-surface-hover'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        />
      </div>

      {/* Team selector */}
      <div>
        <label className="block text-sm font-medium text-txt-primary mb-1">
          Team *
        </label>
        <select
          {...register('externalTeamId')}
          className="w-full px-3 py-2 bg-surface-default border border-bdr-default rounded-lg
                   text-txt-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
        >
          <option value="">Select team</option>
          {externalTeams?.map(team => (
            <option key={team.id} value={team.id}>
              {team.name}
              {team.division && ` (${team.division})`}
            </option>
          ))}
        </select>
        {errors.externalTeamId && (
          <p className="mt-1 text-sm text-red-500">{errors.externalTeamId.message}</p>
        )}
        {!externalTeams?.length && !loadingTeams && (
          <p className="mt-1 text-xs text-txt-tertiary">
            No teams found. Teams are added from race results.
          </p>
        )}
      </div>

      {/* Boat class and ranking */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-txt-primary mb-1">
            Boat Class *
          </label>
          <select
            {...register('boatClass')}
            className="w-full px-3 py-2 bg-surface-default border border-bdr-default rounded-lg
                     text-txt-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            <option value="">Select class</option>
            {boatClasses.map(bc => (
              <option key={bc.value} value={bc.value}>{bc.label}</option>
            ))}
          </select>
          {errors.boatClass && (
            <p className="mt-1 text-sm text-red-500">{errors.boatClass.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-txt-primary mb-1">
            Ranking *
          </label>
          <input
            type="number"
            {...register('ranking', { valueAsNumber: true })}
            min={1}
            className="w-full px-3 py-2 bg-surface-default border border-bdr-default rounded-lg
                     text-txt-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
          {errors.ranking && (
            <p className="mt-1 text-sm text-red-500">{errors.ranking.message}</p>
          )}
        </div>
      </div>

      {/* Season and date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-txt-primary mb-1">
            Season
          </label>
          <select
            {...register('season')}
            className="w-full px-3 py-2 bg-surface-default border border-bdr-default rounded-lg
                     text-txt-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            {SEASONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-txt-primary mb-1">
            As of Date *
          </label>
          <input
            type="date"
            {...register('updatedDate')}
            className="w-full px-3 py-2 bg-surface-default border border-bdr-default rounded-lg
                     text-txt-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
          {errors.updatedDate && (
            <p className="mt-1 text-sm text-red-500">{errors.updatedDate.message}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-txt-primary mb-1">
          Notes
        </label>
        <textarea
          {...register('notes')}
          rows={2}
          className="w-full px-3 py-2 bg-surface-default border border-bdr-default rounded-lg
                   text-txt-primary placeholder:text-txt-tertiary resize-none
                   focus:outline-none focus:ring-2 focus:ring-accent-primary"
          placeholder="Source URL, additional context..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-bdr-default">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-txt-secondary
                   bg-surface-elevated rounded-lg hover:bg-surface-hover transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white
                   bg-accent-primary rounded-lg hover:bg-accent-primary-hover
                   disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Saving...' : 'Add Ranking'}
        </button>
      </div>
    </form>
  );
}
