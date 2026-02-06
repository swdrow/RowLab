/**
 * AuthContext - TanStack Query-based authentication context
 *
 * Provides synchronous access to auth state backed by TQ queries.
 * Matches the interface of the legacy authStore for clean migration.
 *
 * Features:
 * - User and team data from TQ queries with proper cache management
 * - Login/logout/switchTeam mutations
 * - Access token management (in-memory, matches authStore pattern)
 * - Automatic token refresh on 401 via api.ts interceptors
 */

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import api from '../utils/api';

// =============================================================================
// TYPES
// =============================================================================

interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  isAdmin: boolean;
}

interface Team {
  id: string;
  name: string;
  role: string;
  slug?: string;
  isCoxswain?: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthContextValue {
  // State
  user: User | null;
  teams: Team[];
  activeTeamId: string | null;
  activeTeam: Team | null;
  activeTeamRole: string | null;
  activeTeamIsCoxswain: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  accessToken: string | null;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchTeam: (teamId: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => void;
  clearError: () => void;
  getActiveTeam: () => Team | null;
  getAuthHeaders: () => Record<string, string>;
}

// =============================================================================
// CONTEXT
// =============================================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// =============================================================================
// API FUNCTIONS
// =============================================================================

async function fetchCurrentUser(): Promise<{
  user: User;
  teams: Team[];
  activeTeamId: string | null;
}> {
  const response = await api.get('/api/v1/auth/me');
  const { user, teams, activeTeamId } = response.data.data;
  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      isAdmin: user.isAdmin,
    },
    teams: teams || [],
    activeTeamId: activeTeamId || null,
  };
}

async function loginUser(credentials: LoginCredentials) {
  const response = await api.post('/api/v1/auth/login', credentials);
  return response.data.data;
}

async function logoutUser(accessToken: string | null) {
  if (accessToken) {
    await api.post('/api/v1/auth/logout');
  }
}

async function switchTeamRequest(teamId: string) {
  const response = await api.post('/api/v1/auth/switch-team', { teamId });
  return response.data.data;
}

// =============================================================================
// PROVIDER
// =============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Query for current user and teams
  const userQuery = useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: fetchCurrentUser,
    staleTime: Infinity, // User data rarely changes
    retry: 1,
    enabled: false, // Don't auto-fetch on mount, we'll trigger manually
  });

  // Initialize auth on mount - try to refresh token and fetch user
  useEffect(() => {
    async function initialize() {
      try {
        // Try to refresh token to check if session is valid
        const refreshResponse = await api.post('/api/v1/auth/refresh');
        if (refreshResponse.data?.data?.accessToken) {
          const token = refreshResponse.data.data.accessToken;
          setAccessToken(token);
          // Now fetch user data
          await queryClient.fetchQuery({
            queryKey: queryKeys.auth.user(),
            queryFn: fetchCurrentUser,
          });
        }
      } catch (err) {
        // No valid session, that's ok
        console.debug('No active session on init');
      } finally {
        setIsInitialized(true);
      }
    }

    initialize();
  }, [queryClient]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      const { user, teams, activeTeamId, accessToken: token } = data;
      setAccessToken(token);
      setError(null);
      // Update query cache directly
      queryClient.setQueryData(queryKeys.auth.user(), {
        user,
        teams,
        activeTeamId,
      });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Login failed');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => logoutUser(accessToken),
    onSuccess: () => {
      setAccessToken(null);
      setError(null);
      // Clear all queries
      queryClient.clear();
    },
    onError: (err: any) => {
      console.error('Logout error:', err);
      // Clear state regardless
      setAccessToken(null);
      setError(null);
      queryClient.clear();
    },
  });

  // Switch team mutation
  const switchTeamMutation = useMutation({
    mutationFn: switchTeamRequest,
    onSuccess: (data) => {
      const { accessToken: newToken, team } = data;
      setAccessToken(newToken);
      setError(null);
      // Update the cached user data with new activeTeamId
      queryClient.setQueryData(queryKeys.auth.user(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          activeTeamId: team.id,
        };
      });
      // Invalidate team-dependent queries
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
      queryClient.invalidateQueries({ queryKey: ['lineups'] });
      queryClient.invalidateQueries({ queryKey: ['ergTests'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Failed to switch team');
    },
  });

  // Sync accessToken to api.ts axios instance (it reads from authStore currently)
  // We'll expose it via context for now, api.ts will be updated in Plan 03
  useEffect(() => {
    // Store token for api interceptor to access
    if (accessToken) {
      (window as any).__rowlab_access_token = accessToken;
    } else {
      delete (window as any).__rowlab_access_token;
    }
  }, [accessToken]);

  // Compute derived state
  const userData = userQuery.data;
  const user = userData?.user || null;
  const teams = userData?.teams || [];
  const activeTeamId = userData?.activeTeamId || null;
  const activeTeam = teams.find((t) => t.id === activeTeamId) || null;
  const activeTeamRole = activeTeam?.role || null;
  const activeTeamIsCoxswain = activeTeam?.isCoxswain || false;
  const isAuthenticated = !!user;
  const isLoading =
    userQuery.isLoading ||
    loginMutation.isPending ||
    logoutMutation.isPending ||
    switchTeamMutation.isPending;

  // Actions
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        await loginMutation.mutateAsync(credentials);
        return { success: true };
      } catch (err: any) {
        return {
          success: false,
          error: err.response?.data?.message || err.message || 'Login failed',
        };
      }
    },
    [loginMutation]
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const switchTeam = useCallback(
    async (teamId: string) => {
      try {
        await switchTeamMutation.mutateAsync(teamId);
        return { success: true };
      } catch (err: any) {
        return {
          success: false,
          error: err.response?.data?.message || err.message || 'Failed to switch team',
        };
      }
    },
    [switchTeamMutation]
  );

  const refreshUser = useCallback(() => {
    userQuery.refetch();
  }, [userQuery]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getActiveTeam = useCallback(() => {
    return activeTeam;
  }, [activeTeam]);

  const getAuthHeaders = useCallback(() => {
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  }, [accessToken]);

  const value: AuthContextValue = {
    // State
    user,
    teams,
    activeTeamId,
    activeTeam,
    activeTeamRole,
    activeTeamIsCoxswain,
    isAuthenticated,
    isLoading,
    isInitialized,
    accessToken,
    error,
    // Actions
    login,
    logout,
    switchTeam,
    refreshUser,
    clearError,
    getActiveTeam,
    getAuthHeaders,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// =============================================================================
// HOOK
// =============================================================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
