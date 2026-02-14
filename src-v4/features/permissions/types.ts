/**
 * Permission system types.
 *
 * Defines the 4-tier role hierarchy (OWNER > ADMIN > COACH > ATHLETE),
 * coach tool identifiers, and feature flag shapes.
 */

// ---------------------------------------------------------------------------
// Role hierarchy
// ---------------------------------------------------------------------------

export type TeamRole = 'OWNER' | 'ADMIN' | 'COACH' | 'ATHLETE';

/**
 * Numeric role levels for hierarchy comparison.
 * Higher number = more permissions.
 */
export const ROLE_HIERARCHY: Record<TeamRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  COACH: 2,
  ATHLETE: 1,
} as const;

/**
 * Get the numeric level for a role string.
 * Returns 0 for unknown/null roles (below ATHLETE).
 */
export function getRoleLevel(role: string | null): number {
  if (!role) return 0;
  return ROLE_HIERARCHY[role as TeamRole] ?? 0;
}

// ---------------------------------------------------------------------------
// Coach tools
// ---------------------------------------------------------------------------

export type CoachTool =
  | 'lineup'
  | 'seat_racing'
  | 'fleet'
  | 'training'
  | 'attendance'
  | 'whiteboard'
  | 'recruiting';

export const ALL_COACH_TOOLS: CoachTool[] = [
  'lineup',
  'seat_racing',
  'fleet',
  'training',
  'attendance',
  'whiteboard',
  'recruiting',
];

// ---------------------------------------------------------------------------
// Feature flags
// ---------------------------------------------------------------------------

export interface ToolFlag {
  athleteReadOnly: boolean;
}

export type FeatureFlags = Record<CoachTool, ToolFlag>;
