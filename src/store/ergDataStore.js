/**
 * @deprecated V1 Legacy — replaced by V2/V3 erg data components.
 * See: src/v2/pages/ErgTestsPage.tsx, src/v2/hooks/useErgTests.ts
 * Removal planned: Phase 36 (V1/V2 Cleanup)
 *
 * This V1 Zustand store has been replaced by V2 TanStack Query hooks:
 * - useErgTests (src/v2/hooks/useErgTests.ts)
 *
 * V1 legacy components still reference this store. Do NOT add new functionality here.
 * New erg data features should use the V2 hooks.
 */

import { create } from 'zustand';
import useAuthStore from './authStore';

/**
 * Erg Data Store - Manages erg test and workout data
 *
 * Features:
 * - Erg test CRUD operations
 * - Workout management
 * - Leaderboard fetching
 * - Filter management for queries
 * - Uses authenticatedFetch from authStore for API calls
 */
export const useErgDataStore = create((set, get) => ({
  // ===== State =====
  ergTests: [],
  workouts: [],
  leaderboard: [],
  loading: false,
  error: null,
  filters: {
    testType: null,
    athleteId: null,
    fromDate: null,
    toDate: null,
  },

  // ===== Filter Actions =====

  /**
   * Set filters for erg test queries
   */
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  /**
   * Clear all filters
   */
  clearFilters: () =>
    set({
      filters: { testType: null, athleteId: null, fromDate: null, toDate: null },
    }),

  // ===== Erg Test Actions =====

  /**
   * Fetch erg tests with optional filters
   */
  fetchErgTests: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const { authenticatedFetch } = useAuthStore.getState();
      const params = new URLSearchParams();

      const mergedFilters = { ...get().filters, ...filters };
      Object.entries(mergedFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const queryString = params.toString();
      const url = queryString ? `/api/v1/erg-tests?${queryString}` : '/api/v1/erg-tests';

      const response = await authenticatedFetch(url);
      const data = await response.json();

      if (data.success) {
        set({ ergTests: data.data.tests, loading: false });
        return data.data.tests;
      } else {
        throw new Error(data.error?.message || 'Failed to fetch erg tests');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Fetch team leaderboard for a specific test type
   */
  fetchLeaderboard: async (testType, limit = 20) => {
    set({ loading: true, error: null });
    try {
      const { authenticatedFetch } = useAuthStore.getState();
      const response = await authenticatedFetch(
        `/api/v1/erg-tests/leaderboard?testType=${testType}&limit=${limit}`
      );
      const data = await response.json();

      if (data.success) {
        set({ leaderboard: data.data.leaderboard, loading: false });
        return data.data.leaderboard;
      } else {
        throw new Error(data.error?.message || 'Failed to fetch leaderboard');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Create a new erg test
   */
  createErgTest: async (testData) => {
    set({ loading: true, error: null });
    try {
      const { authenticatedFetch } = useAuthStore.getState();
      const response = await authenticatedFetch('/api/v1/erg-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      });
      const data = await response.json();

      if (data.success) {
        set((state) => ({
          ergTests: [data.data.test, ...state.ergTests],
          loading: false,
        }));
        return data.data.test;
      } else {
        throw new Error(data.error?.message || 'Failed to create erg test');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Update an existing erg test
   */
  updateErgTest: async (testId, updates) => {
    set({ loading: true, error: null });
    try {
      const { authenticatedFetch } = useAuthStore.getState();
      const response = await authenticatedFetch(`/api/v1/erg-tests/${testId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();

      if (data.success) {
        set((state) => ({
          ergTests: state.ergTests.map((t) => (t.id === testId ? data.data.test : t)),
          loading: false,
        }));
        return data.data.test;
      } else {
        throw new Error(data.error?.message || 'Failed to update erg test');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Delete an erg test
   */
  deleteErgTest: async (testId) => {
    set({ loading: true, error: null });
    try {
      const { authenticatedFetch } = useAuthStore.getState();
      const response = await authenticatedFetch(`/api/v1/erg-tests/${testId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        set((state) => ({
          ergTests: state.ergTests.filter((t) => t.id !== testId),
          loading: false,
        }));
        return true;
      } else {
        throw new Error(data.error?.message || 'Failed to delete erg test');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ===== Workout Actions =====

  /**
   * Fetch workouts with optional filters
   */
  fetchWorkouts: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const { authenticatedFetch } = useAuthStore.getState();
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const queryString = params.toString();
      const url = queryString ? `/api/v1/workouts?${queryString}` : '/api/v1/workouts';

      const response = await authenticatedFetch(url);
      const data = await response.json();

      if (data.success) {
        set({ workouts: data.data.workouts, loading: false });
        return data.data.workouts;
      } else {
        throw new Error(data.error?.message || 'Failed to fetch workouts');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ===== Utility Actions =====

  /**
   * Clear error state
   */
  clearError: () => set({ error: null }),
}));

export default useErgDataStore;
