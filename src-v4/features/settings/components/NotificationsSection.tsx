/**
 * Notifications settings section -- event-type grouped toggles with per-channel controls.
 * Synced to backend via TanStack Query with optimistic updates.
 * Falls back to defaults for new users.
 */
import { useCallback, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IconBell, IconMail, IconSmartphone, IconLayout, IconClock } from '@/components/icons';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { settingsQueryOptions, useUpdateSettings, type NotificationPrefs } from '../api';
import { SaveIndicator } from './SaveIndicator';

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
  inApp: {
    allActivity: true,
  },
  digest: {
    enabled: false,
    frequency: 'weekly',
  },
};

/* ------------------------------------------------------------------ */
/* Notification groups config                                          */
/* ------------------------------------------------------------------ */

interface NotifToggle {
  key: string;
  channel: 'email' | 'push' | 'inApp';
  label: string;
  description: string;
}

interface NotifGroup {
  id: string;
  title: string;
  icon: React.ReactNode;
  toggles: NotifToggle[];
}

const NOTIF_GROUPS: NotifGroup[] = [
  {
    id: 'training',
    title: 'Training & Workouts',
    icon: <IconClock className="w-4 h-4 text-accent-teal" />,
    toggles: [
      {
        key: 'weeklyTrainingSummary',
        channel: 'email',
        label: 'Weekly Training Summary',
        description: 'Receive a weekly recap of your training activity',
      },
      {
        key: 'workoutReminders',
        channel: 'push',
        label: 'Workout Reminders',
        description: 'Push notifications before scheduled training sessions',
      },
    ],
  },
  {
    id: 'achievements',
    title: 'Achievements & PRs',
    icon: <IconBell className="w-4 h-4 text-accent-teal" />,
    toggles: [
      {
        key: 'prAchievements',
        channel: 'email',
        label: 'PR Achievements (Email)',
        description: 'Email when you set a new personal record',
      },
    ],
  },
  {
    id: 'team',
    title: 'Team Activity',
    icon: <IconSmartphone className="w-4 h-4 text-accent-teal" />,
    toggles: [
      {
        key: 'teamAnnouncements',
        channel: 'email',
        label: 'Team Announcements (Email)',
        description: 'Updates from your team coaches and admins',
      },
      {
        key: 'teamActivity',
        channel: 'push',
        label: 'Team Activity (Push)',
        description: 'When teammates complete workouts or set PRs',
      },
      {
        key: 'allActivity',
        channel: 'inApp',
        label: 'All Activity (In-App)',
        description: 'Show all team activity in your notification feed',
      },
    ],
  },
  {
    id: 'system',
    title: 'System & Product',
    icon: <IconMail className="w-4 h-4 text-accent-teal" />,
    toggles: [
      {
        key: 'productUpdates',
        channel: 'email',
        label: 'Product Updates (Email)',
        description: 'New features and improvements to oarbit',
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Toggle Switch                                                        */
/* ------------------------------------------------------------------ */

function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  disabled,
  channelIcon,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  channelIcon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex items-start gap-2 min-w-0">
        {channelIcon && <span className="mt-0.5 shrink-0 text-text-faint">{channelIcon}</span>}
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-bright">{label}</p>
          {description && <p className="text-xs text-text-faint mt-0.5">{description}</p>}
        </div>
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
/* Channel icon helper                                                  */
/* ------------------------------------------------------------------ */

function getChannelIcon(channel: 'email' | 'push' | 'inApp') {
  switch (channel) {
    case 'email':
      return <IconMail className="w-3.5 h-3.5" />;
    case 'push':
      return <IconSmartphone className="w-3.5 h-3.5" />;
    case 'inApp':
      return <IconLayout className="w-3.5 h-3.5" />;
  }
}

/* ------------------------------------------------------------------ */
/* NotificationsSection                                                 */
/* ------------------------------------------------------------------ */

export function NotificationsSection() {
  const { data: settings } = useQuery(settingsQueryOptions());
  const { mutate: updateSettings, isPending } = useUpdateSettings();

  const prefs: NotificationPrefs = settings?.notificationPrefs ?? DEFAULT_PREFS;

  // Track save indicator per group
  const [saveStatus, setSaveStatus] = useState<Record<string, 'idle' | 'saved' | 'error'>>({});

  // Helper to get a toggle's current value from prefs
  const getToggleValue = useCallback(
    (channel: 'email' | 'push' | 'inApp', key: string): boolean => {
      const channelPrefs = prefs[channel] as Record<string, boolean>;
      return channelPrefs?.[key] ?? false;
    },
    [prefs]
  );

  // Helper to update a toggle
  const updateToggle = useCallback(
    (groupId: string, channel: 'email' | 'push' | 'inApp', key: string, value: boolean) => {
      const updated: NotificationPrefs = {
        ...prefs,
        [channel]: { ...prefs[channel], [key]: value },
      };
      setSaveStatus((prev) => ({ ...prev, [groupId]: 'idle' }));
      updateSettings(
        { notificationPrefs: updated },
        {
          onSuccess: () => {
            setSaveStatus((prev) => ({ ...prev, [groupId]: 'saved' }));
          },
          onError: () => {
            setSaveStatus((prev) => ({ ...prev, [groupId]: 'error' }));
          },
        }
      );
    },
    [prefs, updateSettings]
  );

  // Auto-clear "saved" after 2s
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const [groupId, status] of Object.entries(saveStatus)) {
      if (status === 'saved') {
        timers.push(
          setTimeout(() => {
            setSaveStatus((prev) => ({ ...prev, [groupId]: 'idle' }));
          }, 2000)
        );
      }
    }
    return () => timers.forEach(clearTimeout);
  }, [saveStatus]);

  // Digest handlers
  const updateDigest = useCallback(
    (key: 'enabled' | 'frequency', value: boolean | 'daily' | 'weekly') => {
      const updated: NotificationPrefs = {
        ...prefs,
        digest: { ...prefs.digest, [key]: value },
      };
      setSaveStatus((prev) => ({ ...prev, digest: 'idle' }));
      updateSettings(
        { notificationPrefs: updated },
        {
          onSuccess: () => {
            setSaveStatus((prev) => ({ ...prev, digest: 'saved' }));
          },
          onError: () => {
            setSaveStatus((prev) => ({ ...prev, digest: 'error' }));
          },
        }
      );
    },
    [prefs, updateSettings]
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Notifications"
        description="Control how and when oarbit contacts you"
        icon={<IconBell className="w-4 h-4" />}
      />

      {/* Event-type groups */}
      {NOTIF_GROUPS.map((group) => (
        <Card key={group.id}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {group.icon}
              <h3 className="text-sm font-display font-semibold text-text-bright">{group.title}</h3>
            </div>
            <SaveIndicator status={saveStatus[group.id] || 'idle'} />
          </div>
          <div className="divide-y divide-edge-default/50">
            {group.toggles.map((toggle) => (
              <ToggleSwitch
                key={`${toggle.channel}-${toggle.key}`}
                label={toggle.label}
                description={toggle.description}
                checked={getToggleValue(toggle.channel, toggle.key)}
                onChange={(v) => updateToggle(group.id, toggle.channel, toggle.key, v)}
                disabled={isPending}
                channelIcon={getChannelIcon(toggle.channel)}
              />
            ))}
          </div>
        </Card>
      ))}

      {/* Digest Frequency */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IconClock className="w-4 h-4 text-accent-teal" />
            <h3 className="text-sm font-display font-semibold text-text-bright">Email Digest</h3>
          </div>
          <SaveIndicator status={saveStatus['digest'] || 'idle'} />
        </div>
        <div className="space-y-3">
          <ToggleSwitch
            label="Enable Email Digest"
            description="Receive a summary of your notifications instead of individual emails"
            checked={prefs.digest.enabled}
            onChange={(v) => updateDigest('enabled', v)}
            disabled={isPending}
          />
          {prefs.digest.enabled && (
            <div className="flex items-center gap-3 pl-2">
              <span className="text-sm text-text-dim">Frequency:</span>
              <div className="flex gap-2">
                {(['daily', 'weekly'] as const).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => updateDigest('frequency', freq)}
                    className={`
                      px-3 py-1 rounded-lg text-sm font-medium transition-colors cursor-pointer
                      ${
                        prefs.digest.frequency === freq
                          ? 'bg-accent-teal/10 text-accent-teal ring-1 ring-accent-teal/30'
                          : 'text-text-dim hover:text-text-bright hover:bg-void-deep'
                      }
                    `.trim()}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
