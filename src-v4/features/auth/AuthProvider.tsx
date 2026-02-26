/**
 * AuthProvider: manages auth initialization, token lifecycle, and user state.
 *
 * On mount: attempts silent refresh to restore session.
 * While !isInitialized: full-screen skeleton prevents flash-of-login-page.
 * Listens for oarbit:auth:expired custom event from the axios interceptor.
 * Wraps children in QueryClientProvider.
 */
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { setAccessToken } from '@/lib/api';
import {
  loginWithCredentials,
  logout as logoutApi,
  refreshSession,
  getMe,
  switchTeam as switchTeamApi,
} from './api';
import type { AuthContextValue, Team, User } from '@/types/auth';

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [activeTeamRole, setActiveTeamRole] = useState<string | null>(null);
  const initAttempted = useRef(false);

  // Clear all auth state
  const clearAuth = useCallback(() => {
    setAccessToken(null);
    setIsAuthenticated(false);
    setUser(null);
    setTeams([]);
    setActiveTeamId(null);
    setActiveTeamRole(null);
    queryClient.clear();
  }, []);

  // Initialize: try silent refresh on mount
  useEffect(() => {
    if (initAttempted.current) return;
    initAttempted.current = true;

    async function initialize() {
      try {
        const data = await refreshSession();
        setAccessToken(data.accessToken);

        // Fetch user profile with teams
        const meData = await getMe();
        const u = meData.user;

        setUser({
          id: u.id,
          email: u.email,
          name: u.name,
          username: u.username,
          avatarUrl: u.avatarUrl ?? null,
          isAdmin: u.isAdmin,
        });

        // Extract teams from memberships or teams field
        const userTeams: Team[] = u.memberships
          ? u.memberships.map((m) => ({
              id: m.team.id,
              name: m.team.name,
              slug: m.team.slug,
              role: m.role,
            }))
          : (u.teams ?? []);

        setTeams(userTeams);

        // Set active team from first membership if available
        if (userTeams.length > 0) {
          const first = userTeams[0]!;
          setActiveTeamId(first.id);
          setActiveTeamRole(first.role);
        }

        setIsAuthenticated(true);
      } catch {
        // No valid refresh token -- user is not authenticated
        clearAuth();
      } finally {
        setIsInitialized(true);
      }
    }

    void initialize();
  }, [clearAuth]);

  // Listen for auth:expired events from axios interceptor
  useEffect(() => {
    function handleExpired() {
      clearAuth();
    }

    window.addEventListener('oarbit:auth:expired', handleExpired);
    return () => window.removeEventListener('oarbit:auth:expired', handleExpired);
  }, [clearAuth]);

  // Login with email/password
  const login = useCallback(async (email: string, password: string) => {
    const data = await loginWithCredentials({ email, password });
    setAccessToken(data.accessToken);

    setUser({
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      username: data.user.username,
      avatarUrl: data.user.avatarUrl ?? null,
      isAdmin: data.user.isAdmin,
    });
    setTeams(data.teams);
    setActiveTeamId(data.activeTeamId);

    // Find role for active team
    const activeTeam = data.teams.find((t) => t.id === data.activeTeamId);
    setActiveTeamRole(activeTeam?.role ?? null);
    setIsAuthenticated(true);
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore logout errors -- clear local state regardless
    }
    clearAuth();
  }, [clearAuth]);

  // Switch team
  const switchTeam = useCallback(async (teamId: string) => {
    const data = await switchTeamApi({ teamId });
    setAccessToken(data.accessToken);
    setActiveTeamId(data.team.id);
    setActiveTeamRole(data.team.role);
    // Invalidate team-scoped queries
    void queryClient.invalidateQueries();
  }, []);

  // Refresh auth (re-fetch user/teams)
  const refreshAuth = useCallback(async () => {
    try {
      const data = await refreshSession();
      setAccessToken(data.accessToken);

      const meData = await getMe();
      const u = meData.user;

      setUser({
        id: u.id,
        email: u.email,
        name: u.name,
        username: u.username,
        avatarUrl: u.avatarUrl ?? null,
        isAdmin: u.isAdmin,
      });

      const userTeams: Team[] = u.memberships
        ? u.memberships.map((m) => ({
            id: m.team.id,
            name: m.team.name,
            slug: m.team.slug,
            role: m.role,
          }))
        : (u.teams ?? []);

      setTeams(userTeams);
      setIsAuthenticated(true);
    } catch {
      clearAuth();
    }
  }, [clearAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isInitialized,
      isAuthenticated,
      user,
      teams,
      activeTeamId,
      activeTeamRole,
      login,
      logout,
      switchTeam,
      refreshAuth,
    }),
    [
      isInitialized,
      isAuthenticated,
      user,
      teams,
      activeTeamId,
      activeTeamRole,
      login,
      logout,
      switchTeam,
      refreshAuth,
    ]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </QueryClientProvider>
  );
}
