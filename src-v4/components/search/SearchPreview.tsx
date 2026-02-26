/**
 * SearchPreview: type-specific preview pane for the selected search result.
 * Renders on desktop only (>768px). Shows context-aware details for each entity type.
 */
import {
  IconDumbbell,
  IconUser,
  IconUsers,
  IconCalendarDays,
  IconSearch,
} from '@/components/icons';
import type {
  SearchWorkoutResult,
  SearchTeamResult,
  SearchSessionResult,
  SearchAthlete,
} from '@/hooks/useSearchData';
import type { SearchEntry } from './searchRegistry';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type PreviewItem =
  | { type: 'workout'; data: SearchWorkoutResult }
  | { type: 'athlete'; data: SearchAthlete }
  | { type: 'team'; data: SearchTeamResult }
  | { type: 'session'; data: SearchSessionResult }
  | { type: 'page'; data: SearchEntry }
  | null;

interface SearchPreviewProps {
  item: PreviewItem;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function SearchPreview({ item }: SearchPreviewProps) {
  if (!item) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-text-faint">
        <IconSearch width={32} height={32} className="opacity-30" />
        <p className="text-sm">Select an item to preview</p>
      </div>
    );
  }

  switch (item.type) {
    case 'workout':
      return <WorkoutPreview workout={item.data} />;
    case 'athlete':
      return <AthletePreview athlete={item.data} />;
    case 'team':
      return <TeamPreview team={item.data} />;
    case 'session':
      return <SessionPreview session={item.data} />;
    case 'page':
      return <PagePreview page={item.data} />;
  }
}

/* ------------------------------------------------------------------ */
/* Sub-previews                                                        */
/* ------------------------------------------------------------------ */

function formatPace(tenths: number): string {
  const totalSeconds = tenths / 10;
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}/500m`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function WorkoutPreview({ workout }: { workout: SearchWorkoutResult }) {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center gap-2 mb-4">
        <IconDumbbell width={20} height={20} className="text-accent-teal" />
        <h3 className="text-text-bright font-display font-semibold text-base truncate">
          {workout.composedTitle}
        </h3>
      </div>

      <div className="space-y-3 flex-1">
        <PreviewRow label="Date" value={workout.dateStr} />
        {workout.distanceM != null && workout.distanceM > 0 && (
          <PreviewRow label="Distance" value={`${workout.distanceM.toLocaleString()}m`} mono />
        )}
        {workout.durationSeconds != null && workout.durationSeconds > 0 && (
          <PreviewRow label="Time" value={formatDuration(workout.durationSeconds)} mono />
        )}
        {workout.avgPace != null && workout.avgPace > 0 && (
          <PreviewRow label="Pace" value={formatPace(workout.avgPace)} mono />
        )}
        {workout.avgWatts != null && workout.avgWatts > 0 && (
          <PreviewRow label="Watts" value={`${workout.avgWatts}W`} mono />
        )}
        {workout.strokeRate != null && workout.strokeRate > 0 && (
          <PreviewRow label="SPM" value={`${workout.strokeRate}`} mono />
        )}
        {workout.avgHeartRate != null && workout.avgHeartRate > 0 && (
          <PreviewRow label="HR" value={`${workout.avgHeartRate} bpm`} mono />
        )}
        {workout.machineType && <PreviewRow label="Machine" value={workout.machineType} />}
      </div>

      <div className="mt-auto pt-3 border-t border-edge-default/50">
        <span className="inline-flex items-center rounded-md bg-void-raised px-2 py-0.5 text-[10px] font-medium text-text-faint uppercase tracking-wider">
          {workout.source}
        </span>
      </div>
    </div>
  );
}

function AthletePreview({ athlete }: { athlete: SearchAthlete }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-void-raised">
        <IconUser width={32} height={32} className="text-text-faint" />
      </div>
      <h3 className="text-text-bright font-display font-semibold text-base">{athlete.name}</h3>
      {athlete.email && <p className="text-text-dim text-sm">{athlete.email}</p>}
    </div>
  );
}

function TeamPreview({ team }: { team: SearchTeamResult }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-void-raised">
        <IconUsers width={32} height={32} className="text-text-faint" />
      </div>
      <h3 className="text-text-bright font-display font-semibold text-base">{team.name}</h3>
      <p className="text-text-dim text-sm">@{team.identifier}</p>
      {team.memberCount != null && (
        <p className="text-text-faint text-xs">
          {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

function SessionPreview({ session }: { session: SearchSessionResult }) {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center gap-2 mb-4">
        <IconCalendarDays width={20} height={20} className="text-accent-teal" />
        <h3 className="text-text-bright font-display font-semibold text-base truncate">
          {session.name}
        </h3>
      </div>

      <div className="space-y-3">
        <PreviewRow
          label="Date"
          value={
            session.date
              ? new Date(session.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'N/A'
          }
        />
        <PreviewRow label="Type" value={session.type} />
        <div className="flex items-center justify-between">
          <span className="text-text-faint text-xs uppercase tracking-wider">Status</span>
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
              session.status === 'ACTIVE'
                ? 'bg-accent-teal/20 text-accent-teal'
                : session.status === 'COMPLETED'
                  ? 'bg-data-good/20 text-data-good'
                  : 'bg-void-raised text-text-faint'
            }`}
          >
            {session.status}
          </span>
        </div>
      </div>
    </div>
  );
}

function PagePreview({ page }: { page: SearchEntry }) {
  const Icon = page.icon;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-void-raised">
        <Icon width={32} height={32} className="text-text-faint" />
      </div>
      <h3 className="text-text-bright font-display font-semibold text-base">{page.label}</h3>
      {page.description && <p className="text-text-dim text-sm text-center">{page.description}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared preview row                                                  */
/* ------------------------------------------------------------------ */

function PreviewRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-faint text-xs uppercase tracking-wider">{label}</span>
      <span className={`text-text-bright text-sm ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
