/**
 * Settings types for V2 settings feature
 * Based on V1 SettingsPage.jsx state and /api/v1/settings endpoints
 */

/**
 * User profile data
 */
export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar: string | null;
}

/**
 * User preferences
 */
export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  darkMode: boolean;
  compactView: boolean;
  autoSave: boolean;
}

/**
 * Combined settings response from /api/v1/settings
 */
export interface UserSettings extends UserProfile, UserPreferences {}

/**
 * Settings update payload
 */
export interface UpdateSettingsPayload extends Partial<UserProfile>, Partial<UserPreferences> {}

/**
 * Team visibility settings (OWNER only)
 */
export interface TeamVisibility {
  athletesCanSeeRankings: boolean;
  athletesCanSeeOthersErgData: boolean;
  athletesCanSeeOthersLineups: boolean;
}

/**
 * Team settings response from /api/v1/settings/team
 */
export interface TeamSettings {
  visibility: TeamVisibility;
}

/**
 * Integration connection status
 */
export interface IntegrationStatus {
  connected: boolean;
  username?: string;
  lastSyncedAt: string | null;
  syncEnabled?: boolean;
}

/**
 * Concept2 status extends base integration
 */
export interface C2Status extends IntegrationStatus {}

/**
 * Strava status extends base integration
 */
export interface StravaStatus extends IntegrationStatus {}

/**
 * C2 to Strava sync configuration
 */
export interface C2SyncConfig {
  enabled: boolean;
  types: Record<string, boolean>;
  availableTypes: Record<string, { label: string; stravaType: string }>;
  hasWriteScope: boolean;
  lastSyncedAt: string | null;
}

/**
 * C2 to Strava sync result
 */
export interface C2ToStravaSyncResult {
  synced: number;
  skipped: number;
  failed: number;
}

/**
 * OAuth URL response
 */
export interface OAuthUrlResponse {
  url: string;
}

/**
 * Strava OAuth URL response
 */
export interface StravaAuthUrlResponse {
  authUrl: string;
}

/**
 * Subscription status for billing
 */
export interface SubscriptionStatus {
  planId: string;
  status: string;
  currentPeriodEnd: string | null;
}

/**
 * Usage statistics for billing
 */
export interface UsageStats {
  athletes: { used: number; limit: number };
  coaches: { used: number; limit: number };
}

/**
 * Settings tab type
 */
export type SettingsTab = 'profile' | 'preferences' | 'security' | 'integrations' | 'notifications' | 'team' | 'billing';

/**
 * API response wrapper for settings endpoints
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}
