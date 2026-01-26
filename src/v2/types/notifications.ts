// TypeScript types for Notification Preferences

// ============================================
// NOTIFICATION CHANNELS
// ============================================

/**
 * Notification delivery channels.
 * - inApp: Toast notifications in the UI
 * - email: Email notifications (future)
 * - push: Browser push notifications (future)
 */
export type NotificationChannel = 'inApp' | 'email' | 'push';

// ============================================
// NOTIFICATION FEATURES
// ============================================

/**
 * Features that can trigger notifications.
 * Each feature can be individually enabled/disabled.
 */
export type NotificationFeature =
  | 'recruitVisitAssigned'      // Host assigned to recruit visit
  | 'recruitVisitReminder'      // Upcoming visit reminder
  | 'seatRacingResults'         // Seat racing results available
  | 'trainingPlanAssigned'      // New training plan assigned
  | 'ergTestScheduled'          // Erg test on calendar
  | 'regattaReminder'           // Upcoming regatta
  | 'sessionStarting'           // Live session about to start
  | 'achievementEarned';        // New achievement unlocked (future)

/**
 * Configuration for a notification feature.
 */
export interface NotificationFeatureConfig {
  id: NotificationFeature;
  name: string;
  description: string;
  defaultEnabled: boolean;
  channels: NotificationChannel[]; // Which channels this feature supports
}

// ============================================
// QUIET HOURS
// ============================================

export interface QuietHoursConfig {
  enabled: boolean;
  startTime: string; // HH:mm (e.g., "22:00")
  endTime: string;   // HH:mm (e.g., "08:00")
  excludeInApp: boolean; // If true, quiet hours don't affect in-app toasts
}

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

export interface NotificationPreferences {
  /**
   * Channel-level toggles.
   * Master switch for each channel type.
   */
  channels: Record<NotificationChannel, boolean>;

  /**
   * Feature-level toggles.
   * Individual control for each notification type.
   */
  features: Record<NotificationFeature, boolean>;

  /**
   * Quiet hours configuration.
   * Suppresses notifications during specified time window.
   */
  quietHours: QuietHoursConfig;
}

// ============================================
// NOTIFICATION STORE STATE
// ============================================

export interface NotificationStoreState extends NotificationPreferences {
  // Actions
  setChannelEnabled: (channel: NotificationChannel, enabled: boolean) => void;
  setFeatureEnabled: (feature: NotificationFeature, enabled: boolean) => void;
  setQuietHours: (config: QuietHoursConfig) => void;
  resetToDefaults: () => void;

  // Computed
  shouldNotify: (feature: NotificationFeature, channel: NotificationChannel) => boolean;
  isInQuietHours: () => boolean;
}

// ============================================
// FEATURE CONFIGURATIONS
// ============================================

export const NOTIFICATION_FEATURES: NotificationFeatureConfig[] = [
  {
    id: 'recruitVisitAssigned',
    name: 'Recruit Visit Assignment',
    description: 'When you are assigned as host for a recruit visit',
    defaultEnabled: true,
    channels: ['inApp', 'email'],
  },
  {
    id: 'recruitVisitReminder',
    name: 'Recruit Visit Reminders',
    description: 'Reminder before scheduled recruit visits',
    defaultEnabled: true,
    channels: ['inApp', 'email', 'push'],
  },
  {
    id: 'seatRacingResults',
    name: 'Seat Racing Results',
    description: 'When seat racing results are processed',
    defaultEnabled: true,
    channels: ['inApp', 'email'],
  },
  {
    id: 'trainingPlanAssigned',
    name: 'Training Plan Assignment',
    description: 'When a new training plan is assigned to you',
    defaultEnabled: true,
    channels: ['inApp', 'email'],
  },
  {
    id: 'ergTestScheduled',
    name: 'Erg Test Scheduled',
    description: 'When an erg test appears on your calendar',
    defaultEnabled: true,
    channels: ['inApp'],
  },
  {
    id: 'regattaReminder',
    name: 'Regatta Reminders',
    description: 'Reminders for upcoming regattas',
    defaultEnabled: true,
    channels: ['inApp', 'email', 'push'],
  },
  {
    id: 'sessionStarting',
    name: 'Live Session Starting',
    description: 'When a live erg session is about to begin',
    defaultEnabled: true,
    channels: ['inApp', 'push'],
  },
  {
    id: 'achievementEarned',
    name: 'Achievements Earned',
    description: 'When you earn a new achievement or badge',
    defaultEnabled: true,
    channels: ['inApp'],
  },
];

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  channels: {
    inApp: true,
    email: true,
    push: false, // Requires explicit opt-in
  },
  features: Object.fromEntries(
    NOTIFICATION_FEATURES.map(f => [f.id, f.defaultEnabled])
  ) as Record<NotificationFeature, boolean>,
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
    excludeInApp: true,
  },
};
