/**
 * Privacy settings section -- radio groups for profile and workout visibility.
 * Synced to backend via TanStack Query with optimistic updates.
 */
import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IconShield, IconEye, IconTrophy } from '@/components/icons';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { settingsQueryOptions, useUpdateSettings, type PrivacyPrefs } from '../api';

/* ------------------------------------------------------------------ */
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

const DEFAULT_PREFS: PrivacyPrefs = {
  profileVisibility: 'team',
  workoutVisibility: 'same',
  showInLeaderboards: true,
};

/* ------------------------------------------------------------------ */
/* Radio Option                                                         */
/* ------------------------------------------------------------------ */

function RadioOption<T extends string>({
  value,
  selected,
  onChange,
  label,
  description,
}: {
  value: T;
  selected: boolean;
  onChange: (value: T) => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onChange(value)}
      className={`
        flex items-start gap-3 w-full p-3 rounded-xl text-left transition-all duration-150 cursor-pointer
        ${
          selected
            ? 'ring-1 ring-accent bg-accent-teal/5'
            : 'border border-edge-default hover:border-text-primary/20'
        }
      `.trim()}
    >
      {/* Radio circle */}
      <div
        className={`
          mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 transition-colors duration-150
          flex items-center justify-center
          ${selected ? 'border-accent-teal' : 'border-text-faint'}
        `.trim()}
      >
        {selected && <div className="w-2 h-2 rounded-full bg-accent-teal" />}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium text-text-bright">{label}</p>
        <p className="text-xs text-text-faint mt-0.5">{description}</p>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle Switch                                                        */
/* ------------------------------------------------------------------ */

function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-bright">{label}</p>
        {description && <p className="text-xs text-text-faint mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative shrink-0 w-11 h-6 rounded-full transition-colors duration-150 cursor-pointer
          ${checked ? 'bg-accent-teal' : 'bg-void-deep'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `.trim()}
      >
        <span
          className={`
            absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm
            transition-transform duration-150
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `.trim()}
        />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PrivacySection                                                       */
/* ------------------------------------------------------------------ */

export function PrivacySection() {
  const { data: settings } = useQuery(settingsQueryOptions());
  const { mutate: updateSettings, isPending } = useUpdateSettings();

  const prefs: PrivacyPrefs = settings?.privacyPrefs ?? DEFAULT_PREFS;

  const updatePref = useCallback(
    <K extends keyof PrivacyPrefs>(key: K, value: PrivacyPrefs[K]) => {
      const updated: PrivacyPrefs = { ...prefs, [key]: value };
      updateSettings({ privacyPrefs: updated });
    },
    [prefs, updateSettings]
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Privacy"
        description="Control who can see your training data"
        icon={<IconShield className="w-4 h-4" />}
      />

      {/* Profile Visibility */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <IconEye className="w-4 h-4 text-accent-teal" />
          <h3 className="text-sm font-semibold text-text-bright">Profile Visibility</h3>
        </div>
        <div className="space-y-2" role="radiogroup" aria-label="Profile visibility">
          <RadioOption
            value="public"
            selected={prefs.profileVisibility === 'public'}
            onChange={(v) => updatePref('profileVisibility', v)}
            label="Public"
            description="Anyone can view your profile and training stats"
          />
          <RadioOption
            value="team"
            selected={prefs.profileVisibility === 'team'}
            onChange={(v) => updatePref('profileVisibility', v)}
            label="Team Only"
            description="Only members of your team can see your profile"
          />
          <RadioOption
            value="private"
            selected={prefs.profileVisibility === 'private'}
            onChange={(v) => updatePref('profileVisibility', v)}
            label="Private"
            description="Only you can see your full profile"
          />
        </div>
      </Card>

      {/* Workout Visibility */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <IconEye className="w-4 h-4 text-accent-teal" />
          <h3 className="text-sm font-semibold text-text-bright">Workout Visibility</h3>
        </div>
        <div className="space-y-2" role="radiogroup" aria-label="Workout visibility">
          <RadioOption
            value="same"
            selected={prefs.workoutVisibility === 'same'}
            onChange={(v) => updatePref('workoutVisibility', v)}
            label="Same as Profile"
            description="Match your profile visibility setting"
          />
          <RadioOption
            value="team"
            selected={prefs.workoutVisibility === 'team'}
            onChange={(v) => updatePref('workoutVisibility', v)}
            label="Team Only"
            description="Only team members can see your workout data"
          />
          <RadioOption
            value="private"
            selected={prefs.workoutVisibility === 'private'}
            onChange={(v) => updatePref('workoutVisibility', v)}
            label="Private"
            description="Keep all workout data private"
          />
        </div>
      </Card>

      {/* Leaderboard Toggle */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <IconTrophy className="w-4 h-4 text-accent-teal" />
          <h3 className="text-sm font-semibold text-text-bright">Leaderboards</h3>
        </div>
        <ToggleSwitch
          label="Show in Team Leaderboards"
          description="Your stats will appear in team rankings and leaderboards"
          checked={prefs.showInLeaderboards}
          onChange={(v) => updatePref('showInLeaderboards', v)}
          disabled={isPending}
        />
      </Card>
    </div>
  );
}
