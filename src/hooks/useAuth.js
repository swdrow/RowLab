import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

/**
 * Hook for authentication - wraps authStore with navigation helpers
 */
export function useAuth() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    teams,
    activeTeamId,
    activeTeamRole,
    isAuthenticated,
    isLoading,
    error,
    isInitialized,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    switchTeam: storeSwitchTeam,
    createTeam: storeCreateTeam,
    joinTeamByCode: storeJoinTeamByCode,
    initialize,
    clearError,
    getActiveTeam,
    getAuthHeaders,
    authenticatedFetch,
  } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Login with redirect
  const login = useCallback(
    async (email, password) => {
      const result = await storeLogin(email, password);

      if (result.success) {
        // Redirect to original destination or app
        const from = location.state?.from?.pathname || '/app';
        navigate(from, { replace: true });
      }

      return result;
    },
    [storeLogin, navigate, location]
  );

  // Register with redirect to login
  const register = useCallback(
    async (data) => {
      const result = await storeRegister(data);

      if (result.success) {
        navigate('/login', {
          state: { message: 'Account created! Please log in.' },
        });
      }

      return result;
    },
    [storeRegister, navigate]
  );

  // Logout with redirect
  const logout = useCallback(async () => {
    await storeLogout();
    navigate('/login', { replace: true });
  }, [storeLogout, navigate]);

  // Switch team
  const switchTeam = useCallback(
    async (teamId) => {
      const result = await storeSwitchTeam(teamId);

      if (result.success) {
        // Optionally refresh current page data
        window.location.reload();
      }

      return result;
    },
    [storeSwitchTeam]
  );

  // Create team
  const createTeam = useCallback(
    async (data) => {
      const result = await storeCreateTeam(data);

      if (result.success) {
        navigate('/app', { replace: true });
      }

      return result;
    },
    [storeCreateTeam, navigate]
  );

  // Join team by code
  const joinTeamByCode = useCallback(
    async (code) => {
      const result = await storeJoinTeamByCode(code);

      if (result.success) {
        // Switch to the new team
        await storeSwitchTeam(result.team.id);
      }

      return result;
    },
    [storeJoinTeamByCode, storeSwitchTeam]
  );

  // Check if user has specific role
  const hasRole = useCallback(
    (...roles) => {
      return roles.includes(activeTeamRole);
    },
    [activeTeamRole]
  );

  // Check if user is coach or owner
  const isCoachOrOwner = useCallback(() => {
    return hasRole('OWNER', 'COACH');
  }, [hasRole]);

  // Check if user is team owner
  const isOwner = useCallback(() => {
    return hasRole('OWNER');
  }, [hasRole]);

  return {
    // State
    user,
    teams,
    activeTeamId,
    activeTeamRole,
    activeTeam: getActiveTeam(),
    isAuthenticated,
    isLoading,
    error,
    isInitialized,

    // Actions
    login,
    register,
    logout,
    switchTeam,
    createTeam,
    joinTeamByCode,
    clearError,

    // Helpers
    hasRole,
    isCoachOrOwner,
    isOwner,
    getAuthHeaders,
    authenticatedFetch,
  };
}

/**
 * Hook for requiring authentication
 * Redirects to login if not authenticated
 */
export function useRequireAuth() {
  const { isAuthenticated, isInitialized, isLoading } = useAuth();
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isInitialized && !isLoading && !isInitializing && !isAuthenticated) {
      navigate('/login', {
        replace: true,
        state: { from: location },
      });
    }
  }, [isAuthenticated, isInitialized, isInitializing, isLoading, navigate, location]);

  return { isAuthenticated, isLoading: isLoading || !isInitialized || isInitializing };
}

/**
 * Hook for requiring specific roles
 */
export function useRequireRole(...requiredRoles) {
  const { isAuthenticated, activeTeamRole, isInitialized, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitialized && !isLoading && isAuthenticated) {
      if (!requiredRoles.includes(activeTeamRole)) {
        navigate('/app', { replace: true });
      }
    }
  }, [isAuthenticated, activeTeamRole, isInitialized, isLoading, navigate, requiredRoles]);

  return {
    hasAccess: requiredRoles.includes(activeTeamRole),
    isLoading: isLoading || !isInitialized,
  };
}

/**
 * Hook for requiring team context
 */
export function useRequireTeam() {
  const { isAuthenticated, activeTeamId, isInitialized, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitialized && !isLoading && isAuthenticated && !activeTeamId) {
      navigate('/onboarding/team', { replace: true });
    }
  }, [isAuthenticated, activeTeamId, isInitialized, isLoading, navigate]);

  return {
    hasTeam: !!activeTeamId,
    isLoading: isLoading || !isInitialized,
  };
}

export default useAuth;
