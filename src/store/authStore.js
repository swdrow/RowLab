import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { handleApiResponse } from '@utils/api';

const API_URL = '/api/v1';

/**
 * Auth Store - Manages authentication state with JWT refresh token rotation
 *
 * Features:
 * - Access token stored in memory (not persisted for security)
 * - Refresh token stored in HTTP-only cookie (handled by server)
 * - Multi-team support with team switching
 * - Automatic token refresh on 401 responses
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      // ===== State =====
      user: null,
      teams: [],
      activeTeamId: null,
      activeTeamRole: null,
      activeTeamIsCoxswain: false, // Track if current user is coxswain in active team
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isInitialized: false,
      isInitializing: false, // Lock to prevent concurrent initialize() calls

      // ===== Auth Actions =====

      /**
       * Register a new user
       */
      register: async ({ email, password, name }) => {
        set({ isLoading: true, error: null });

        try {
          const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name }),
          });

          const data = await handleApiResponse(res, 'Registration failed');

          set({ isLoading: false });
          return { success: true, user: data.data.user };
        } catch (err) {
          set({ isLoading: false, error: err.message });
          return { success: false, error: err.message };
        }
      },

      /**
       * Login with email and password
       */
      login: async (email, password) => {
        set({ isLoading: true, error: null });

        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Include cookies for refresh token
            body: JSON.stringify({ email, password }),
          });

          const data = await handleApiResponse(res, 'Login failed');

          const { user, teams, activeTeamId, accessToken } = data.data;
          const activeTeam = teams.find((t) => t.id === activeTeamId);

          set({
            user,
            teams,
            activeTeamId,
            activeTeamRole: activeTeam?.role || null,
            activeTeamIsCoxswain: activeTeam?.isCoxswain || false,
            accessToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            isInitialized: true,
          });

          return { success: true };
        } catch (err) {
          set({ isLoading: false, error: err.message });
          return { success: false, error: err.message };
        }
      },

      /**
       * Logout - clear state and revoke tokens
       */
      logout: async () => {
        const { accessToken } = get();

        try {
          // Call logout endpoint to revoke refresh token
          if (accessToken) {
            await fetch(`${API_URL}/auth/logout`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              credentials: 'include',
            });
          }
        } catch (err) {
          console.error('Logout error:', err);
        }

        // Clear state regardless of server response
        set({
          user: null,
          teams: [],
          activeTeamId: null,
          activeTeamRole: null,
          activeTeamIsCoxswain: false,
          accessToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      /**
       * Refresh access token using refresh token cookie
       */
      refreshAccessToken: async () => {
        try {
          const res = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
          });

          if (!res.ok) {
            // Refresh failed - clear auth state
            set({
              user: null,
              teams: [],
              activeTeamId: null,
              activeTeamRole: null,
              activeTeamIsCoxswain: false,
              accessToken: null,
              isAuthenticated: false,
            });
            return null;
          }

          const data = await res.json();
          const newAccessToken = data.data.accessToken;

          set({ accessToken: newAccessToken });
          return newAccessToken;
        } catch (err) {
          console.error('Token refresh failed:', err);
          return null;
        }
      },

      /**
       * Get current user info
       */
      fetchCurrentUser: async () => {
        const { accessToken } = get();
        if (!accessToken) return null;

        try {
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!res.ok) {
            if (res.status === 401) {
              // Try to refresh token
              const newToken = await get().refreshAccessToken();
              if (newToken) {
                return get().fetchCurrentUser();
              }
            }
            throw new Error('Failed to fetch user');
          }

          const data = await res.json();
          const { user } = data.data;

          set({
            user: {
              id: user.id,
              email: user.email,
              username: user.username,
              name: user.name,
              isAdmin: user.isAdmin,
            },
            teams: user.teams,
          });

          return user;
        } catch (err) {
          console.error('Fetch user error:', err);
          return null;
        }
      },

      // ===== Team Actions =====

      /**
       * Switch active team context
       */
      switchTeam: async (teamId) => {
        const { accessToken } = get();
        if (!accessToken) return { success: false, error: 'Not authenticated' };

        set({ isLoading: true });

        try {
          const res = await fetch(`${API_URL}/auth/switch-team`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ teamId }),
          });

          const data = await handleApiResponse(res, 'Failed to switch team');

          const { accessToken: newAccessToken, team } = data.data;

          set({
            activeTeamId: team.id,
            activeTeamRole: team.role,
            activeTeamIsCoxswain: team.isCoxswain || false,
            accessToken: newAccessToken,
            isLoading: false,
          });

          return { success: true };
        } catch (err) {
          set({ isLoading: false, error: err.message });
          return { success: false, error: err.message };
        }
      },

      /**
       * Create a new team
       */
      createTeam: async ({ name, isPublic = false }) => {
        const { accessToken } = get();
        if (!accessToken) return { success: false, error: 'Not authenticated' };

        set({ isLoading: true });

        try {
          const res = await fetch(`${API_URL}/teams`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ name, isPublic }),
          });

          const data = await handleApiResponse(res, 'Failed to create team');

          const newTeam = data.data.team;

          // Add team to list and switch to it
          set((state) => ({
            teams: [
              ...state.teams,
              {
                id: newTeam.id,
                name: newTeam.name,
                slug: newTeam.slug,
                role: newTeam.role,
              },
            ],
            isLoading: false,
          }));

          // Switch to the new team
          await get().switchTeam(newTeam.id);

          return { success: true, team: newTeam };
        } catch (err) {
          set({ isLoading: false, error: err.message });
          return { success: false, error: err.message };
        }
      },

      /**
       * Join team by invite code
       */
      joinTeamByCode: async (code) => {
        const { accessToken } = get();
        if (!accessToken) return { success: false, error: 'Not authenticated' };

        set({ isLoading: true });

        try {
          const res = await fetch(`${API_URL}/teams/join/${code}`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          const data = await handleApiResponse(res, 'Failed to join team');

          const newTeam = data.data.team;

          // Add team to list
          set((state) => ({
            teams: [
              ...state.teams,
              {
                id: newTeam.id,
                name: newTeam.name,
                slug: newTeam.slug,
                role: newTeam.role,
              },
            ],
            isLoading: false,
          }));

          return { success: true, team: newTeam };
        } catch (err) {
          set({ isLoading: false, error: err.message });
          return { success: false, error: err.message };
        }
      },

      // ===== Utilities =====

      /**
       * Initialize auth state on app load
       */
      initialize: async () => {
        // Prevent concurrent initialization calls
        if (get().isInitialized || get().isInitializing) return;

        set({ isInitializing: true });

        try {
          // Try to refresh token to check if session is valid
          const token = await get().refreshAccessToken();

          if (token) {
            await get().fetchCurrentUser();
            set({ isAuthenticated: true, isInitialized: true, isInitializing: false });
          } else {
            set({ isInitialized: true, isInitializing: false });
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          set({ isInitialized: true, isInitializing: false });
        }
      },

      /**
       * Get authorization headers for API requests
       */
      getAuthHeaders: () => {
        const { accessToken } = get();
        return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      },

      /**
       * Make authenticated API request with automatic token refresh
       */
      authenticatedFetch: async (url, options = {}) => {
        let { accessToken } = get();

        const makeRequest = async (token) => {
          return fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${token}`,
            },
            credentials: 'include',
          });
        };

        let res = await makeRequest(accessToken);

        // If 401, try to refresh token and retry
        if (res.status === 401) {
          const newToken = await get().refreshAccessToken();
          if (newToken) {
            res = await makeRequest(newToken);
          }
        }

        return res;
      },

      /**
       * Clear error state
       */
      clearError: () => set({ error: null }),

      /**
       * Get active team details
       */
      getActiveTeam: () => {
        const { teams, activeTeamId } = get();
        return teams.find((t) => t.id === activeTeamId) || null;
      },
    }),
    {
      name: 'rowlab-auth-v2',
      partialize: (state) => ({
        // Only persist minimal data - tokens handled via cookies
        user: state.user,
        teams: state.teams,
        activeTeamId: state.activeTeamId,
        activeTeamRole: state.activeTeamRole,
        activeTeamIsCoxswain: state.activeTeamIsCoxswain,
      }),
    }
  )
);

export default useAuthStore;
