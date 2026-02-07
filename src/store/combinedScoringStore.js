import { create } from 'zustand';

// @deprecated This store is deprecated. Use TanStack Query hooks from src/v2/hooks/ instead.
// V1 legacy code still uses this store during migration.

// Helper to extract error message from various error formats
const getErrorMessage = (error, fallback = 'An error occurred') => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.error) return getErrorMessage(error.error, fallback);
  return fallback;
};

export const useCombinedScoringStore = create((set, get) => ({
  rankings: [],
  athleteBreakdown: null,
  loading: false,
  error: null,

  // Helper: Get auth headers
  _getAuthHeaders: () => {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  fetchRankings: async (options = {}) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const params = new URLSearchParams();
      if (options.boatClass) params.append('boatClass', options.boatClass);
      if (options.side) params.append('side', options.side);
      if (options.limit) params.append('limit', options.limit);

      const queryString = params.toString();
      const url = `/api/v1/combined-scoring/rankings${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data.error, 'Failed to fetch rankings'));
      }

      set({ rankings: data.data || [], loading: false });
      return data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchAthleteBreakdown: async (athleteId) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/combined-scoring/athlete/${athleteId}`, { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data.error, 'Failed to fetch athlete breakdown'));
      }

      set({ athleteBreakdown: data.data, loading: false });
      return data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  recalculateTeam: async (options = {}) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();

      // Store current filter options
      const currentState = get();
      const filterOptions = {
        boatClass: currentState.rankings[0]?.boatClass,
        side: currentState.rankings[0]?.side,
      };

      const response = await fetch('/api/v1/combined-scoring/recalculate', {
        method: 'POST',
        headers,
        body: JSON.stringify(options),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data.error, 'Failed to recalculate scores'));
      }

      // Refresh rankings after recalculation, preserving filters
      await get().fetchRankings(filterOptions);
      set({ loading: false });
      return data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  recalculateAthlete: async (athleteId) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/combined-scoring/recalculate/${athleteId}`, {
        method: 'POST',
        headers,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data.error, 'Failed to recalculate athlete score'));
      }

      set({ athleteBreakdown: data.data, loading: false });
      return data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null })
}));
