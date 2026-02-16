/**
 * Notifications settings section -- toggle switches for email and push preferences.
 * Synced to backend via TanStack Query with optimistic updates.
 * Falls back to localStorage defaults for new users.
 */
import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Mail, Smartphone } from 'lucide-react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { settingsQueryOptions, useUpdateSettings, type NotificationPrefs } from '../api';

/* ------------------------------------------------------------------ */
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

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
        <p className="text-sm font-medium text-ink-primary">{label}</p>
        {description && <p className="text-xs text-ink-muted mt-0.5">{description}</p>}
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
          ${checked ? 'bg-accent-copper' : 'bg-ink-well'}
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
/* NotificationsSection                                                 */
/* ------------------------------------------------------------------ */

export function NotificationsSection() {
  const { data: settings } = useQuery(settingsQueryOptions());
  const { mutate: updateSettings, isPending } = useUpdateSettings();

  const prefs: NotificationPrefs = settings?.notificationPrefs ?? DEFAULT_PREFS;

  const updateEmail = useCallback(
    (key: keyof NotificationPrefs['email'], value: boolean) => {
      const updated: NotificationPrefs = {
        ...prefs,
        email: { ...prefs.email, [key]: value },
      };
      updateSettings({ notificationPrefs: updated });
    },
    [prefs, updateSettings]
  );

  const updatePush = useCallback(
    (key: keyof NotificationPrefs['push'], value: boolean) => {
      const updated: NotificationPrefs = {
        ...prefs,
        push: { ...prefs.push, [key]: value },
      };
      updateSettings({ notificationPrefs: updated });
    },
    [prefs, updateSettings]
  );

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
            disabled={isPending}
          />
          <ToggleSwitch
            label="PR Achievements"
            description="Get notified when you set a new personal record"
            checked={prefs.email.prAchievements}
            onChange={(v) => updateEmail('prAchievements', v)}
            disabled={isPending}
          />
          <ToggleSwitch
            label="Team Announcements"
            description="Updates from your team coaches and admins"
            checked={prefs.email.teamAnnouncements}
            onChange={(v) => updateEmail('teamAnnouncements', v)}
            disabled={isPending}
          />
          <ToggleSwitch
            label="Product Updates"
            description="New features and improvements to RowLab"
            checked={prefs.email.productUpdates}
            onChange={(v) => updateEmail('productUpdates', v)}
            disabled={isPending}
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
            disabled={isPending}
          />
          <ToggleSwitch
            label="Team Activity"
            description="Updates when teammates complete workouts or set PRs"
            checked={prefs.push.teamActivity}
            onChange={(v) => updatePush('teamActivity', v)}
            disabled={isPending}
          />
        </div>
      </GlassCard>
    </div>
  );
}
