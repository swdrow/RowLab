/**
 * General settings section -- team info editing.
 *
 * Admin/Coach: full edit form (name, description, sport, slug, welcome message)
 * Athlete: read-only display of team info
 * Uses react-hook-form + zod for validation, useUpdateTeamSettings for persistence.
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IconSave } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { useUpdateTeamSettings } from '../../hooks/useTeamMutations';
import { SlugInput } from '../SlugInput';
import type { TeamDetail } from '../../types';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const generalSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500),
  sport: z.string(),
  slug: z.string(),
  welcomeMessage: z.string().max(1000),
});

type GeneralFormData = z.infer<typeof generalSchema>;

// ---------------------------------------------------------------------------
// Sport options
// ---------------------------------------------------------------------------

const SPORT_OPTIONS = ['Rowing', 'Cycling', 'Running', 'Swimming', 'Other'] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface GeneralSectionProps {
  team: TeamDetail;
  canEdit: boolean;
}

export function GeneralSection({ team, canEdit }: GeneralSectionProps) {
  const updateMutation = useUpdateTeamSettings(team.id);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<GeneralFormData>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      name: team.name,
      description: team.description ?? '',
      sport: team.sport ?? '',
      slug: team.slug ?? '',
      welcomeMessage: team.welcomeMessage ?? '',
    },
  });

  const slugValue = watch('slug');

  function onSubmit(data: GeneralFormData) {
    updateMutation.mutate({
      name: data.name,
      description: data.description || undefined,
      sport: data.sport || undefined,
      slug: data.slug || undefined,
      welcomeMessage: data.welcomeMessage || undefined,
    });
  }

  // Read-only view for athletes
  if (!canEdit) {
    return (
      <div className="flex flex-col gap-4">
        <InfoRow label="Team name" value={team.name} />
        <InfoRow label="Description" value={team.description || 'No description'} />
        <InfoRow label="Sport" value={team.sport || 'Not specified'} />
        {team.slug && <InfoRow label="Custom URL" value={`oarbit.net/team/${team.slug}`} mono />}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* Team name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="team-name" className="text-sm font-medium text-text-default">
          Team name
        </label>
        <input
          id="team-name"
          type="text"
          {...register('name')}
          className="h-10 w-full rounded-xl px-3 text-sm bg-void-raised text-text-bright border border-edge-default focus:border-accent-teal focus:ring-1 focus:ring-accent/30 focus:outline-none transition-colors duration-150"
        />
        {errors.name && <span className="text-xs text-data-poor">{errors.name.message}</span>}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="team-description" className="text-sm font-medium text-text-default">
          Description
        </label>
        <textarea
          id="team-description"
          {...register('description')}
          rows={3}
          className="w-full rounded-xl px-3 py-2.5 text-sm bg-void-raised text-text-bright border border-edge-default focus:border-accent-teal focus:ring-1 focus:ring-accent/30 focus:outline-none transition-colors duration-150 resize-none"
          placeholder="What is this team about?"
        />
        {errors.description && (
          <span className="text-xs text-data-poor">{errors.description.message}</span>
        )}
      </div>

      {/* Sport */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="team-sport" className="text-sm font-medium text-text-default">
          Sport
        </label>
        <select
          id="team-sport"
          {...register('sport')}
          className="h-10 w-full rounded-xl px-3 text-sm bg-void-raised text-text-bright border border-edge-default focus:border-accent-teal focus:ring-1 focus:ring-accent/30 focus:outline-none transition-colors duration-150 appearance-none cursor-pointer"
        >
          <option value="">Select a sport</option>
          {SPORT_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Custom slug */}
      <SlugInput
        teamId={team.id}
        currentSlug={team.slug}
        value={slugValue ?? ''}
        onChange={(s) => setValue('slug', s, { shouldDirty: true })}
      />

      {/* Welcome message */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="team-welcome" className="text-sm font-medium text-text-default">
          Welcome message
        </label>
        <textarea
          id="team-welcome"
          {...register('welcomeMessage')}
          rows={3}
          className="w-full rounded-xl px-3 py-2.5 text-sm bg-void-raised text-text-bright border border-edge-default focus:border-accent-teal focus:ring-1 focus:ring-accent/30 focus:outline-none transition-colors duration-150 resize-none"
          placeholder="Message shown to new members when they join"
        />
        {errors.welcomeMessage && (
          <span className="text-xs text-data-poor">{errors.welcomeMessage.message}</span>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={!isDirty}
          loading={updateMutation.isPending}
        >
          <IconSave width={16} height={16} />
          Save changes
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Read-only info row
// ---------------------------------------------------------------------------

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wider text-text-faint">{label}</span>
      <span className={`text-sm text-text-bright ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
