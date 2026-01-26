import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  NotificationStoreState,
  NotificationChannel,
  NotificationFeature,
  QuietHoursConfig,
} from '@v2/types/notifications';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@v2/types/notifications';

export const useNotificationStore = create<NotificationStoreState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_NOTIFICATION_PREFERENCES,

      setChannelEnabled: (channel: NotificationChannel, enabled: boolean) => {
        set((state) => ({
          channels: { ...state.channels, [channel]: enabled },
        }));
      },

      setFeatureEnabled: (feature: NotificationFeature, enabled: boolean) => {
        set((state) => ({
          features: { ...state.features, [feature]: enabled },
        }));
      },

      setQuietHours: (config: QuietHoursConfig) => {
        set({ quietHours: config });
      },

      resetToDefaults: () => {
        set(DEFAULT_NOTIFICATION_PREFERENCES);
      },

      shouldNotify: (feature: NotificationFeature, channel: NotificationChannel) => {
        const { channels, features, quietHours } = get();

        // Check channel master switch
        if (!channels[channel]) return false;

        // Check feature toggle
        if (!features[feature]) return false;

        // Check quiet hours (skip for in-app if excludeInApp is true)
        if (quietHours.enabled) {
          if (channel === 'inApp' && quietHours.excludeInApp) {
            return true; // In-app notifications bypass quiet hours
          }

          if (get().isInQuietHours()) {
            return false;
          }
        }

        return true;
      },

      isInQuietHours: () => {
        const { quietHours } = get();
        if (!quietHours.enabled) return false;

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const [startHour, startMin] = quietHours.startTime.split(':').map(Number);
        const [endHour, endMin] = quietHours.endTime.split(':').map(Number);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        // Handle overnight quiet hours (e.g., 22:00 - 08:00)
        if (startMinutes > endMinutes) {
          return currentMinutes >= startMinutes || currentMinutes < endMinutes;
        }

        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
      },
    }),
    {
      name: 'rowlab-notification-preferences',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
