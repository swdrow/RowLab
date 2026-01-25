/**
 * Settings feature barrel export
 *
 * Provides clean imports for the settings feature:
 * - import { SettingsPage, useSettings, ProfileSection } from '@v2/features/settings'
 */

// Components
export * from './components';

// Hooks
export * from './hooks';

// Types
export type {
  SettingsTab,
  UserProfile,
  UserPreferences,
  UserSettings,
  UpdateSettingsPayload,
  TeamVisibility,
  TeamSettings,
  IntegrationStatus,
  C2Status,
  StravaStatus,
  C2SyncConfig,
  C2ToStravaSyncResult,
  OAuthUrlResponse,
  StravaAuthUrlResponse,
  SubscriptionStatus,
  UsageStats,
  ApiResponse,
} from '@v2/types/settings';

// Pages
export { SettingsPage } from './pages/SettingsPage';
