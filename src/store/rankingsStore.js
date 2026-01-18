import { create } from 'zustand';

/**
 * Zustand store for managing athlete rankings
 *
 * Features:
 * - Fetch rankings with filtering options
 * - Get individual athlete ratings
 * - Trigger ranking recalculation
 */
const useRankingsStore = create((set, get) => ({
  // Data
  rankings: [],

  // UI state
  loading: false,
  error: null,

  // ============================================
  // Helper: Get auth token
  // ============================================
  _getAuthHeaders: () => {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  // ============================================
  // Rankings Operations
  // ============================================

  /**
   * Fetch rankings with optional filters
   * @param {Object} options - Query options
   * @param {string} options.type - Ranking type filter
   * @param {number} options.minRaces - Minimum races filter
   */
  fetchRankings: async (options = {}) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();

      // Build query string from options
      const params = new URLSearchParams();
      if (options.type) {
        params.append('type', options.type);
      }
      if (options.minRaces !== undefined) {
        params.append('minRaces', options.minRaces);
      }

      const queryString = params.toString();
      const url = `/api/v1/rankings${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, { headers });
      const data = await response.json();

      if (data.success) {
        set({ rankings: data.data.rankings || data.data || [], loading: false });
        return data.data.rankings || data.data;
      }
      throw new Error(data.error?.message || 'Failed to fetch rankings');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Get rating for a specific athlete
   * @param {string|number} athleteId - The athlete's ID
   */
  getAthleteRating: async (athleteId) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/rankings/athlete/${athleteId}`, {
        headers,
      });
      const data = await response.json();

      if (data.success) {
        set({ loading: false });
        return data.data.rating || data.data;
      }
      throw new Error(data.error?.message || 'Failed to fetch athlete rating');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Trigger recalculation of all rankings
   */
  recalculateRankings: async () => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch('/api/v1/rankings/recalculate', {
        method: 'POST',
        headers,
      });
      const data = await response.json();

      if (data.success) {
        // Optionally refresh rankings after recalculation
        const result = data.data;
        set({ loading: false });
        return result;
      }
      throw new Error(data.error?.message || 'Failed to recalculate rankings');
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
}));

export default useRankingsStore;
