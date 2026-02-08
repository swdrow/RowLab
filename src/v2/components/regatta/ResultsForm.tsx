import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Trophy, Medal } from 'lucide-react';
import type { Race, RaceResult, RaceResultFormData } from '../../types/regatta';
import { useLineups } from '../../hooks/useLineups';
import { parseTimeToSeconds, formatSecondsToTime } from '../../utils/timeFormatters';

const resultSchema = z.object({
  teamName: z.string().min(1, 'Team name is required'),
  isOwnTeam: z.boolean().default(false),
  lineupId: z.string().nullable().optional(),
  finishTimeStr: z.string().optional(),
  place: z.number().int().positive().nullable().optional(),
}).refine(data => data.finishTimeStr || data.place, {
  message: 'Either time or place is required',
  path: ['place'],
});

const formSchema = z.object({
  results: z.array(resultSchema).min(1, 'Add at least one result'),
});

type FormValues = z.infer<typeof formSchema>;

type ResultsFormProps = {
  race: Race;
  existingResults?: RaceResult[];
  onSubmit: (results: RaceResultFormData[]) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
};

export function ResultsForm({
  race,
  existingResults = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ResultsFormProps) {
  const { data: lineups } = useLineups({ boatClass: race.boatClass });

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      results: existingResults.length > 0
        ? existingResults.map(r => ({
            teamName: r.teamName,
            isOwnTeam: r.isOwnTeam,
            lineupId: r.lineupId,
            finishTimeStr: r.finishTimeSeconds ? formatSecondsToTime(r.finishTimeSeconds) : '',
            place: r.place,
          }))
        : [{ teamName: '', isOwnTeam: true, lineupId: null, finishTimeStr: '', place: null }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'results',
  });

  const onFormSubmit = (data: FormValues) => {
    const results: RaceResultFormData[] = data.results.map(r => ({
      teamName: r.teamName,
      isOwnTeam: r.isOwnTeam,
      lineupId: r.lineupId || null,
      finishTimeSeconds: r.finishTimeStr ? parseTimeToSeconds(r.finishTimeStr) : null,
      place: r.place || null,
      marginBackSeconds: null, // Calculated server-side
      rawSpeed: null,
      adjustedSpeed: null,
    }));

    // Sort by place for margin calculation
    results.sort((a, b) => (a.place || 999) - (b.place || 999));

    onSubmit(results);
  };

  const addResult = () => {
    append({ teamName: '', isOwnTeam: false, lineupId: null, finishTimeStr: '', place: fields.length + 1 });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="text-sm text-txt-secondary mb-4">
        Enter results for <span className="font-medium text-txt-primary">{race.eventName}</span>
        {' '}{race.boatClass} ({race.distanceMeters}m)
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => {
          const isOwnTeam = watch(`results.${index}.isOwnTeam`);
          return (
            <div
              key={field.id}
              className={`p-4 rounded-lg border ${
                isOwnTeam
                  ? 'bg-data-good/5 border-accent-primary/30'
                  : 'bg-ink-raised border-ink-border'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Place indicator */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-ink-well flex items-center justify-center">
                  {index === 0 && <Trophy className="w-4 h-4 text-data-warning" />}
                  {index === 1 && <Medal className="w-4 h-4 text-txt-tertiary" />}
                  {index === 2 && <Medal className="w-4 h-4 text-amber-600" />}
                  {index > 2 && <span className="text-sm font-medium text-txt-secondary">{index + 1}</span>}
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* Team name */}
                  <div className="md:col-span-2">
                    <input
                      {...register(`results.${index}.teamName`)}
                      placeholder="Team name"
                      className="w-full px-3 py-2 bg-ink-well border border-ink-border rounded-lg
                               text-txt-primary placeholder:text-txt-tertiary text-sm
                               focus:outline-none focus:ring-2 focus:ring-focus-ring"
                    />
                    {errors.results?.[index]?.teamName && (
                      <p className="mt-1 text-xs text-data-poor">
                        {errors.results[index]?.teamName?.message}
                      </p>
                    )}
                  </div>

                  {/* Place */}
                  <div>
                    <input
                      type="number"
                      {...register(`results.${index}.place`, { valueAsNumber: true })}
                      placeholder="Place"
                      min={1}
                      className="w-full px-3 py-2 bg-ink-well border border-ink-border rounded-lg
                               text-txt-primary placeholder:text-txt-tertiary text-sm
                               focus:outline-none focus:ring-2 focus:ring-focus-ring"
                    />
                  </div>

                  {/* Time */}
                  <div>
                    <input
                      {...register(`results.${index}.finishTimeStr`)}
                      placeholder="M:SS.s"
                      className="w-full px-3 py-2 bg-ink-well border border-ink-border rounded-lg
                               text-txt-primary placeholder:text-txt-tertiary text-sm font-mono
                               focus:outline-none focus:ring-2 focus:ring-focus-ring"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-xs text-txt-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      {...register(`results.${index}.isOwnTeam`)}
                      className="w-3.5 h-3.5 rounded border-ink-border text-data-good"
                    />
                    Us
                  </label>

                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-1.5 rounded hover:bg-ink-hover text-txt-tertiary hover:text-data-poor transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Lineup selector for own team */}
              {isOwnTeam && lineups && lineups.length > 0 && (
                <div className="mt-3 ml-11">
                  <select
                    {...register(`results.${index}.lineupId`)}
                    className="w-full max-w-xs px-3 py-1.5 bg-ink-well border border-ink-border rounded-lg
                             text-txt-primary text-sm focus:outline-none focus:ring-2 focus:ring-focus-ring"
                  >
                    <option value="">Link to lineup (optional)</option>
                    {lineups.map(lineup => (
                      <option key={lineup.id} value={lineup.id}>{lineup.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add result button */}
      <button
        type="button"
        onClick={addResult}
        className="w-full py-2 border-2 border-dashed border-ink-border rounded-lg
                 text-sm text-txt-secondary hover:border-ink-border-strong hover:text-txt-primary
                 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Entry
      </button>

      {/* Form errors */}
      {errors.results?.root && (
        <p className="text-sm text-data-poor">{errors.results.root.message}</p>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-ink-border">
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
          {isSubmitting ? 'Saving...' : 'Save Results'}
        </button>
      </div>
    </form>
  );
}
