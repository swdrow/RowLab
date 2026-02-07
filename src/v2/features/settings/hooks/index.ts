/**
 * Settings hooks barrel export
 * Re-exports hooks from @v2/hooks/ for feature-based imports
 */

// User settings
export { useSettings, useUpdateSettings, settingsKeys } from '@v2/hooks/useSettings';

// Team settings
export {
  useTeamSettings,
  useUpdateTeamVisibility,
  teamSettingsKeys,
} from '@v2/hooks/useTeamSettings';

// Integration hooks
export {
  useC2Status,
  useConnectC2,
  useDisconnectC2,
  useSyncC2,
  useStravaStatus,
  useConnectStrava,
  useDisconnectStrava,
  useSyncStrava,
  useC2SyncConfig,
  useUpdateC2SyncConfig,
  useSyncC2ToStrava,
} from '@v2/hooks/useIntegrations';

// Face detection for photo uploads
export { useFaceDetection } from '@v2/hooks/useFaceDetection';
