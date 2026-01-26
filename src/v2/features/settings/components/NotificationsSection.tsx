import { Bell, Mail, Smartphone, Moon, Clock } from 'lucide-react';
import { useNotificationStore } from '@v2/stores/notificationStore';
import { NOTIFICATION_FEATURES } from '@v2/types/notifications';
import type { NotificationChannel, NotificationFeature } from '@v2/types/notifications';

const CHANNEL_ICONS: Record<NotificationChannel, React.ComponentType<{ className?: string }>> = {
  inApp: Bell,
  email: Mail,
  push: Smartphone,
};

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  inApp: 'In-App',
  email: 'Email',
  push: 'Push',
};

export function NotificationsSection() {
  const {
    channels,
    features,
    quietHours,
    setChannelEnabled,
    setFeatureEnabled,
    setQuietHours,
    resetToDefaults,
  } = useNotificationStore();

  return (
    <div className="space-y-8">
      {/* Channel Master Switches */}
      <section>
        <h3 className="text-lg font-semibold text-txt-primary mb-4">Notification Channels</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {(Object.keys(channels) as NotificationChannel[]).map(channel => {
            const Icon = CHANNEL_ICONS[channel];
            return (
              <div
                key={channel}
                className="flex items-center justify-between p-4 bg-surface-elevated rounded-xl border border-bdr"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-txt-secondary" />
                  <span className="font-medium text-txt-primary">{CHANNEL_LABELS[channel]}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channels[channel]}
                    onChange={(e) => setChannelEnabled(channel, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-interactive-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-interactive-primary"></div>
                </label>
              </div>
            );
          })}
        </div>
        <p className="text-sm text-txt-tertiary mt-2">
          Push notifications require browser permission.
        </p>
      </section>

      {/* Quiet Hours */}
      <section>
        <h3 className="text-lg font-semibold text-txt-primary mb-4 flex items-center gap-2">
          <Moon className="w-5 h-5" />
          Quiet Hours
        </h3>
        <div className="p-4 bg-surface-elevated rounded-xl border border-bdr space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-txt-primary">Enable Quiet Hours</p>
              <p className="text-sm text-txt-secondary">
                Pause email and push notifications during set hours
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={quietHours.enabled}
                onChange={(e) => setQuietHours({ ...quietHours, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-interactive-primary"></div>
            </label>
          </div>

          {quietHours.enabled && (
            <div className="flex items-center gap-4 pt-4 border-t border-bdr">
              <Clock className="w-5 h-5 text-txt-secondary" />
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={quietHours.startTime}
                  onChange={(e) => setQuietHours({ ...quietHours, startTime: e.target.value })}
                  className="px-3 py-2 bg-surface border border-bdr rounded-lg text-sm"
                />
                <span className="text-txt-secondary">to</span>
                <input
                  type="time"
                  value={quietHours.endTime}
                  onChange={(e) => setQuietHours({ ...quietHours, endTime: e.target.value })}
                  className="px-3 py-2 bg-surface border border-bdr rounded-lg text-sm"
                />
              </div>
            </div>
          )}

          {quietHours.enabled && (
            <label className="flex items-center gap-2 text-sm text-txt-secondary">
              <input
                type="checkbox"
                checked={quietHours.excludeInApp}
                onChange={(e) => setQuietHours({ ...quietHours, excludeInApp: e.target.checked })}
                className="rounded"
              />
              Still show in-app toasts during quiet hours
            </label>
          )}
        </div>
      </section>

      {/* Feature-Specific Notifications */}
      <section>
        <h3 className="text-lg font-semibold text-txt-primary mb-4">Notification Types</h3>
        <div className="space-y-3">
          {NOTIFICATION_FEATURES.map(feature => (
            <div
              key={feature.id}
              className="flex items-center justify-between p-4 bg-surface-elevated rounded-xl border border-bdr"
            >
              <div className="flex-1">
                <p className="font-medium text-txt-primary">{feature.name}</p>
                <p className="text-sm text-txt-secondary">{feature.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  {feature.channels.map(channel => {
                    const Icon = CHANNEL_ICONS[channel];
                    return (
                      <span
                        key={channel}
                        className="inline-flex items-center gap-1 text-xs text-txt-tertiary"
                      >
                        <Icon className="w-3 h-3" />
                        {CHANNEL_LABELS[channel]}
                      </span>
                    );
                  })}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={features[feature.id]}
                  onChange={(e) => setFeatureEnabled(feature.id, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-interactive-primary"></div>
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Reset */}
      <div className="pt-4 border-t border-bdr">
        <button
          onClick={resetToDefaults}
          className="text-sm text-txt-secondary hover:text-txt-primary"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
