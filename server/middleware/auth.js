import { verifyAccessToken } from '../services/tokenService.js';

/**
 * Verify JWT and attach user to request
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'NO_TOKEN', message: 'Authentication required' },
    });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' },
    });
  }

  req.user = {
    id: payload.sub,
    email: payload.email,
    activeTeamId: payload.activeTeamId,
    activeTeamRole: payload.activeTeamRole,
  };

  next();
}

/**
 * Optional authentication - sets req.user if token valid, continues otherwise
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      req.user = {
        id: payload.sub,
        email: payload.email,
        activeTeamId: payload.activeTeamId,
        activeTeamRole: payload.activeTeamRole,
      };
    }
  }

  next();
}

/**
 * Role hierarchy for permission checks.
 * Higher number = more permissions.
 */
const ROLE_HIERARCHY = { OWNER: 5, ADMIN: 4, COACH: 3, COXSWAIN: 2, ATHLETE: 1 };

/**
 * Require specific roles.
 *
 * Uses role hierarchy: if a route requires COACH, ADMIN and OWNER
 * automatically qualify because they outrank COACH.
 * Accepts individual strings or an array as the first argument.
 */
export function requireRole(...roles) {
  // Flatten in case someone passes an array: requireRole(['OWNER', 'COACH'])
  const flatRoles = roles.flat();

  // Compute the minimum required level from the listed roles
  const minLevel = Math.min(...flatRoles.map((r) => ROLE_HIERARCHY[r] ?? 999));

  return (req, res, next) => {
    if (!req.user.activeTeamRole) {
      return res.status(403).json({
        success: false,
        error: { code: 'NO_TEAM', message: 'No active team selected' },
      });
    }

    const userLevel = ROLE_HIERARCHY[req.user.activeTeamRole] ?? 0;

    // User qualifies if their role level >= minimum required level
    if (userLevel < minLevel) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
    }

    next();
  };
}

/**
 * Require active team context
 */
export function requireTeam(req, res, next) {
  if (!req.user.activeTeamId) {
    return res.status(400).json({
      success: false,
      error: { code: 'NO_TEAM', message: 'No active team selected' },
    });
  }
  next();
}

/**
 * Team isolation middleware - ensures queries are scoped to active team
 */
export function teamIsolation(req, res, next) {
  if (!req.user?.activeTeamId) {
    return res.status(400).json({
      success: false,
      error: { code: 'NO_TEAM', message: 'Team context required' },
    });
  }

  // Attach team filter helper
  req.teamFilter = { teamId: req.user.activeTeamId };
  next();
}

// Legacy exports for backward compatibility
export const verifyToken = authenticateToken;
