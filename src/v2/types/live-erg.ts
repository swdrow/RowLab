// src/v2/types/live-erg.ts
// TypeScript types for Live Erg monitoring dashboard

// ============================================
// ENUMS / LITERAL TYPES
// ============================================

/**
 * Athlete status during live erg session
 */
export type AthleteErgStatus = 'active' | 'resting' | 'finished' | 'pending';

/**
 * View mode for live erg dashboard
 */
export type LiveViewMode = 'leaderboard' | 'grid';

// ============================================
// LIVE ERG DATA TYPES
// ============================================

/**
 * Real-time erg data for a single athlete
 * Represents C2 Logbook data fetched via polling
 */
export interface LiveErgData {
  athleteId: string;
  athleteName: string;
  distance: number; // meters
  time: number; // seconds
  pace: number; // seconds per 500m
  watts: number;
  strokeRate: number; // strokes per minute
  heartRate?: number;
  strokeCount?: number;
  status: AthleteErgStatus;
  lastUpdated: string; // ISO timestamp
}

/**
 * Aggregated session data containing all athletes
 */
export interface LiveSessionData {
  sessionId: string;
  sessionName: string;
  activePieceId?: string;
  activePieceName?: string;
  athletes: LiveErgData[];
  startedAt: string;
  sessionCode: string;
}

// ============================================
// POLLING CONFIGURATION
// ============================================

/**
 * Polling configuration for live erg data fetching
 */
export interface PollingConfig {
  interval: number; // milliseconds
  enabled: boolean;
}

/**
 * Default polling interval (5 seconds per RESEARCH.md recommendation)
 * Balances responsiveness with API load
 */
export const DEFAULT_POLLING_INTERVAL = 5000;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format pace as MM:SS.t (e.g., "1:45.3" for 105.3 seconds)
 */
export function formatPace(seconds: number): string {
  if (!seconds || seconds <= 0) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${tenths}`;
}

/**
 * Format time duration as H:MM:SS or MM:SS
 */
export function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '-';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format distance with appropriate units
 */
export function formatDistance(meters: number): string {
  if (!meters || meters <= 0) return '-';
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }
  return `${meters}m`;
}

// ============================================
// STATUS DISPLAY COLORS
// ============================================

/**
 * Tailwind CSS color classes for athlete status
 */
export const STATUS_COLORS: Record<AthleteErgStatus, string> = {
  active: 'text-green-500',
  resting: 'text-amber-500',
  finished: 'text-blue-500',
  pending: 'text-txt-muted',
};

/**
 * Background colors for status indicators
 */
export const STATUS_BG_COLORS: Record<AthleteErgStatus, string> = {
  active: 'bg-green-500/10',
  resting: 'bg-amber-500/10',
  finished: 'bg-blue-500/10',
  pending: 'bg-surface-default',
};
