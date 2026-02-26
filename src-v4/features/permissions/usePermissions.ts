/**
 * usePermissions hook: centralized permission checks for the active team.
 *
 * Returns role booleans, tool access checks (canAccessTool), and
 * read-only detection (isReadOnly) based on the 4-tier role hierarchy
 * and team feature flags.
 *
 * Usage:
 *   const { isCoachOrAbove, canAccessTool, isReadOnly } = usePermissions();
 *   if (canAccessTool('lineup')) { ... }
 *   if (isReadOnly('lineup')) { showReadOnlyBadge(); }
 */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { featureFlagsOptions } from './api';
import { getRoleLevel } from './types';
import type { TeamRole, CoachTool, FeatureFlags } from './types';

export interface PermissionsResult {
  /** Current user's role in the active team (null if no team). */
  role: TeamRole | null;
  /** True if role is OWNER. */
  isOwner: boolean;
  /** True if role is ADMIN. */
  isAdmin: boolean;
  /** True if role is COACH, ADMIN, or OWNER. */
  isCoachOrAbove: boolean;
  /** True if role is ATHLETE. */
  isAthlete: boolean;
  /**
   * Check if the user can access a specific coach tool.
   * COACH+ always can. ATHLETE can only if the tool has athleteReadOnly enabled.
   */
  canAccessTool: (tool: CoachTool) => boolean;
  /**
   * Check if the user has read-only access to a tool.
   * COACH+ is never read-only. ATHLETE is read-only when canAccessTool is true.
   */
  isReadOnly: (tool: CoachTool) => boolean;
  /** Raw feature flags from the backend (null while loading or no team). */
  featureFlags: FeatureFlags | null;
}

export function usePermissions(): PermissionsResult {
  const { activeTeamRole, activeTeamId } = useAuth();

  const { data: featureFlags = null } = useQuery(featureFlagsOptions(activeTeamId));

  const role = (activeTeamRole as TeamRole) ?? null;
  const roleLevel = getRoleLevel(role);

  const isOwner = role === 'OWNER';
  const isAdmin = role === 'ADMIN';
  const isCoachOrAbove = roleLevel >= getRoleLevel('COACH');
  const isAthlete = role === 'ATHLETE';

  function canAccessTool(tool: CoachTool): boolean {
    // COACH, ADMIN, OWNER always have access
    if (roleLevel >= getRoleLevel('COACH')) return true;
    // ATHLETE: only if feature flag grants read-only access
    if (featureFlags && featureFlags[tool]?.athleteReadOnly) return true;
    return false;
  }

  function isReadOnly(tool: CoachTool): boolean {
    // COACH+ is never read-only
    if (roleLevel >= getRoleLevel('COACH')) return false;
    // ATHLETE: read-only when they can access the tool
    return canAccessTool(tool);
  }

  return {
    role,
    isOwner,
    isAdmin,
    isCoachOrAbove,
    isAthlete,
    canAccessTool,
    isReadOnly,
    featureFlags,
  };
}
