import { create } from 'zustand';

// @deprecated This store is deprecated. Use TanStack Query hooks from src/v2/hooks/ instead.
// V1 legacy code still uses this store during migration.
import { getErrorMessage } from '../utils/errorUtils';

// @deprecated This store is deprecated. Use TanStack Query hooks from src/v2/hooks/ instead.
// V1 legacy code still uses this store during migration.

/**
 * Zustand store for managing regattas and race results
 *
 * Features:
 * - CRUD operations for regattas
 * - Race management within regattas
 * - Results entry (single and batch)
 */
const useRegattaStore = create((set, get) => ({
  // Data
  regattas: [],
  currentRegatta: null,

  // UI state
  loading: false,
  error: null,

  // ============================================
  // Helper: Get auth headers
  // ============================================
  _getAuthHeaders: () => {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  // ============================================
  // Regatta CRUD Operations
  // ============================================

  /**
   * Fetch all regattas with optional filtering
   * @param {Object} options - { season, limit }
   */
  fetchRegattas: async (options = {}) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const params = new URLSearchParams();
      if (options.season) params.append('season', options.season);
      if (options.limit) params.append('limit', options.limit);

      const queryString = params.toString();
      const url = `/api/v1/regattas${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(getErrorMessage(data.error, 'Failed to fetch regattas'));
      }

      const data = await response.json();

      set({ regattas: data.data.regattas || [], loading: false });
      return data.data.regattas;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Fetch a single regatta by ID with races and results
   * @param {string} regattaId
   */
  fetchRegatta: async (regattaId) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/regattas/${regattaId}`, { headers });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch regatta';
        try {
          const errorData = await response.json();
          errorMessage = getErrorMessage(errorData.error, errorMessage);
        } catch {
          // Response wasn't JSON, use default message
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      set({ currentRegatta: data.data.regatta, loading: false });
      return data.data.regatta;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Create a new regatta
   * @param {Object} regattaData - { name, location, date, courseType, conditions, description }
   */
  createRegatta: async (regattaData) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch('/api/v1/regattas', {
        method: 'POST',
        headers,
        body: JSON.stringify(regattaData),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create regatta';
        try {
          const errorData = await response.json();
          errorMessage = getErrorMessage(errorData.error, errorMessage);
        } catch {
          // Response wasn't JSON, use default message
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const regatta = data.data.regatta;
      // Prepend to regattas array (newest first)
      set((state) => ({
        regattas: [regatta, ...state.regattas],
        loading: false,
      }));
      return regatta;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ============================================
  // Race Operations
  // ============================================

  /**
   * Add a race to a regatta
   * @param {string} regattaId
   * @param {Object} raceData - { eventName, boatClass, distanceMeters, isHeadRace, scheduledTime }
   */
  addRace: async (regattaId, raceData) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/regattas/${regattaId}/races`, {
        method: 'POST',
        headers,
        body: JSON.stringify(raceData),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data.error, 'Failed to add race'));
      }

      // Refetch regatta to get updated races list
      await get().fetchRegatta(regattaId);
      set({ loading: false });
      return data.data.race;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ============================================
  // Results Operations
  // ============================================

  /**
   * Add a single result to a race
   * @param {string} raceId
   * @param {Object} resultData - { teamName, isOwnTeam, lineupId, finishTimeSeconds, place, marginBackSeconds }
   */
  addResult: async (raceId, resultData) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/regattas/races/${raceId}/results`, {
        method: 'POST',
        headers,
        body: JSON.stringify(resultData),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data.error, 'Failed to add result'));
      }

      set({ loading: false });
      return data.data.result;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Batch add results to a race
   * @param {string} raceId
   * @param {Array} results - Array of result objects
   */
  batchAddResults: async (raceId, results) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/regattas/races/${raceId}/results/batch`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ results }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data.error, 'Failed to batch add results'));
      }

      set({ loading: false });
      return data.data.results;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ============================================
  // Utility Actions
  // ============================================

  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set({
      regattas: [],
      currentRegatta: null,
      loading: false,
      error: null,
    });
  },

  /**
   * Set current regatta locally (without API call)
   */
  setCurrentRegatta: (regatta) => {
    set({ currentRegatta: regatta });
  },

  /**
   * Clear current regatta
   */
  clearCurrentRegatta: () => {
    set({ currentRegatta: null });
  },
}));

export default useRegattaStore;
