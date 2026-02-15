/**
 * Privacy settings section -- radio groups for profile and workout visibility.
 * Preferences stored in localStorage pending backend API.
 * // TODO(phase-53): Wire to backend privacy settings API
 */
import { useState, useCallback, useEffect } from 'react';
import { Shield, Eye, Trophy } from 'lucide-react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { GlassCard } from '@/components/ui/GlassCard';

/* ------------------------------------------------------------------ */
/* Types & Defaults                                                     */
/* ------------------------------------------------------------------ */

type Visibility = 'public' | 'team' | 'private';

interface PrivacyPrefs {
  profileVisibility: Visibility;
  workoutVisibility: 'same' | 'team' | 'private';
  showInLeaderboards: boolean;
}

const DEFAULT_PREFS: PrivacyPrefs = {
  profileVisibility: 'team',
  workoutVisibility: 'same',
  showInLeaderboards: true,
};

const STORAGE_KEY = 'rowlab-privacy-prefs';

function loadPrefs(): PrivacyPrefs {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as PrivacyPrefs;
  } catch {
    // Corrupted data -- reset
  }
  return DEFAULT_PREFS;
}

function savePrefs(prefs: PrivacyPrefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

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
            ? 'ring-1 ring-accent-copper bg-accent-copper/5'
            : 'border border-ink-border hover:border-ink-bright/20'
        }
      `.trim()}
    >
      {/* Radio circle */}
      <div
        className={`
          mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 transition-colors duration-150
          flex items-center justify-center
          ${selected ? 'border-accent-copper' : 'border-ink-muted'}
        `.trim()}
      >
        {selected && <div className="w-2 h-2 rounded-full bg-accent-copper" />}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-primary">{label}</p>
        <p className="text-xs text-ink-muted mt-0.5">{description}</p>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle Switch (reused from Notifications for leaderboard toggle)     */
/* ------------------------------------------------------------------ */

function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-primary">{label}</p>
        {description && <p className="text-xs text-ink-muted mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`
          relative shrink-0 w-11 h-6 rounded-full transition-colors duration-150 cursor-pointer
          ${checked ? 'bg-accent-copper' : 'bg-ink-well'}
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
  const [prefs, setPrefs] = useState<PrivacyPrefs>(loadPrefs);

  // Persist on change
  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  const updatePref = useCallback(<K extends keyof PrivacyPrefs>(key: K, value: PrivacyPrefs[K]) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Privacy"
        description="Control who can see your training data"
        icon={<Shield className="w-4 h-4" />}
      />

      {/* Profile Visibility */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-4 h-4 text-accent-copper" />
          <h3 className="text-sm font-semibold text-ink-primary">Profile Visibility</h3>
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
      </GlassCard>

      {/* Workout Visibility */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-4 h-4 text-accent-copper" />
          <h3 className="text-sm font-semibold text-ink-primary">Workout Visibility</h3>
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
      </GlassCard>

      {/* Leaderboard Toggle */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-accent-copper" />
          <h3 className="text-sm font-semibold text-ink-primary">Leaderboards</h3>
        </div>
        <ToggleSwitch
          label="Show in Team Leaderboards"
          description="Your stats will appear in team rankings and leaderboards"
          checked={prefs.showInLeaderboards}
          onChange={(v) => updatePref('showInLeaderboards', v)}
        />
      </GlassCard>
    </div>
  );
}
