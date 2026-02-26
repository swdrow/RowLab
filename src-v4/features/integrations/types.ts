/**
 * Integration types for Concept2 and Strava connections.
 */

export interface C2Status {
  connected: boolean;
  username: string | null;
  c2UserId: string | null;
  lastSyncedAt: string | null;
  syncEnabled: boolean;
  workoutCount?: number;
}

export interface StravaStatus {
  connected: boolean;
  username: string | null;
  stravaAthleteId: string | null;
  lastSyncedAt: string | null;
  syncEnabled: boolean;
}

export interface SyncResult {
  total: number;
  synced: number;
  skipped: number;
}

export interface IntegrationCardProps {
  /** Icon element to render in the card */
  icon: React.ReactNode;
  /** Tailwind background class for icon container */
  iconBg: string;
  /** Integration title */
  title: string;
  /** Description text (shown when disconnected) */
  description: string;
  /** Whether the integration is connected */
  connected: boolean;
  /** Username/account name when connected */
  username?: string;
  /** Last synced timestamp (ISO string or null) */
  lastSynced?: string | null;
  /** Stats line shown below username when connected (e.g., "21 workouts synced") */
  statsLine?: string;
  /** Handler for connect action */
  onConnect: () => void;
  /** Handler for disconnect action */
  onDisconnect: () => void;
  /** Optional handler for sync action (only shown if provided and connected) */
  onSync?: () => void;
  /** Whether sync is in progress */
  syncLoading?: boolean;
  /** Whether connect is in progress */
  connectLoading?: boolean;
  /** Whether disconnect is in progress */
  disconnectLoading?: boolean;
  /** Custom label for connect button (default: "Connect") */
  connectLabel?: string;
  /** Accent color class for connected state (default: "text-accent-teal") */
  accentColor?: string;
}
