/**
 * Notifications settings section -- toggle switches for email and push preferences.
 * Preferences stored in localStorage pending backend API.
 * // TODO(phase-53): Wire to backend notification preferences API
 */
import { useState, useCallback, useEffect } from 'react';
import { Bell, Mail, Smartphone } from 'lucide-react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { GlassCard } from '@/components/ui/GlassCard';

/* ------------------------------------------------------------------ */
/* Types & Defaults                                                     */
/* ------------------------------------------------------------------ */

interface NotificationPrefs {
  email: {
    weeklyTrainingSummary: boolean;
    prAchievements: boolean;
    teamAnnouncements: boolean;
    productUpdates: boolean;
  };
  push: {
    workoutReminders: boolean;
    teamActivity: boolean;
  };
}

const DEFAULT_PREFS: NotificationPrefs = {
  email: {
    weeklyTrainingSummary: true,
    prAchievements: true,
    teamAnnouncements: true,
    productUpdates: false,
  },
  push: {
    workoutReminders: false,
    teamActivity: true,
  },
};

const STORAGE_KEY = 'rowlab-notification-prefs';

function loadPrefs(): NotificationPrefs {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as NotificationPrefs;
  } catch {
    // Corrupted data -- reset
  }
  return DEFAULT_PREFS;
}

function savePrefs(prefs: NotificationPrefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

/* ------------------------------------------------------------------ */
/* Toggle Switch                                                        */
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
/* NotificationsSection                                                 */
/* ------------------------------------------------------------------ */

export function NotificationsSection() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(loadPrefs);

  // Persist on change
  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  const updateEmail = useCallback((key: keyof NotificationPrefs['email'], value: boolean) => {
    setPrefs((prev) => ({
      ...prev,
      email: { ...prev.email, [key]: value },
    }));
  }, []);

  const updatePush = useCallback((key: keyof NotificationPrefs['push'], value: boolean) => {
    setPrefs((prev) => ({
      ...prev,
      push: { ...prev.push, [key]: value },
    }));
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Notifications"
        description="Control how and when RowLab contacts you"
        icon={<Bell className="w-4 h-4" />}
      />

      {/* Email Notifications */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-4 h-4 text-accent-copper" />
          <h3 className="text-sm font-semibold text-ink-primary">Email Notifications</h3>
        </div>
        <div className="divide-y divide-ink-border/50">
          <ToggleSwitch
            label="Weekly Training Summary"
            description="Receive a weekly recap of your training activity"
            checked={prefs.email.weeklyTrainingSummary}
            onChange={(v) => updateEmail('weeklyTrainingSummary', v)}
          />
          <ToggleSwitch
            label="PR Achievements"
            description="Get notified when you set a new personal record"
            checked={prefs.email.prAchievements}
            onChange={(v) => updateEmail('prAchievements', v)}
          />
          <ToggleSwitch
            label="Team Announcements"
            description="Updates from your team coaches and admins"
            checked={prefs.email.teamAnnouncements}
            onChange={(v) => updateEmail('teamAnnouncements', v)}
          />
          <ToggleSwitch
            label="Product Updates"
            description="New features and improvements to RowLab"
            checked={prefs.email.productUpdates}
            onChange={(v) => updateEmail('productUpdates', v)}
          />
        </div>
      </GlassCard>

      {/* Push Notifications */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="w-4 h-4 text-accent-copper" />
          <h3 className="text-sm font-semibold text-ink-primary">Push Notifications</h3>
        </div>
        <div className="divide-y divide-ink-border/50">
          <ToggleSwitch
            label="Workout Reminders"
            description="Remind you before scheduled training sessions"
            checked={prefs.push.workoutReminders}
            onChange={(v) => updatePush('workoutReminders', v)}
          />
          <ToggleSwitch
            label="Team Activity"
            description="Updates when teammates complete workouts or set PRs"
            checked={prefs.push.teamActivity}
            onChange={(v) => updatePush('teamActivity', v)}
          />
        </div>
      </GlassCard>
    </div>
  );
}
