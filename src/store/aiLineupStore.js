import { create } from 'zustand';

// @deprecated This store is deprecated. Use TanStack Query hooks from src/v2/hooks/ instead.
// V1 legacy code still uses this store during migration.
import { getErrorMessage } from '../utils/errorUtils';

// @deprecated This store is deprecated. Use TanStack Query hooks from src/v2/hooks/ instead.
// V1 legacy code still uses this store during migration.

export const useAILineupStore = create((set, get) => ({
  suggestions: [],
  evaluation: null,
  prediction: null,
  comparison: null,
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

  optimizeLineup: async (boatClass, constraints = {}, options = {}) => {
    set({ loading: true, error: null, suggestions: [] });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch('/api/v1/ai-lineup/optimize', {
        method: 'POST',
        headers,
        body: JSON.stringify({ boatClass, constraints, options }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data.error, 'Failed to generate optimal lineups'));
      }

      set({ suggestions: data.data?.suggestions || data.data || [], loading: false });
      return data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  evaluateLineup: async (athleteIds, boatClass) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch('/api/v1/ai-lineup/evaluate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ athleteIds, boatClass }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data.error, 'Failed to evaluate lineup'));
      }

      set({ evaluation: data.data, loading: false });
      return data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  predictRaceTime: async (athleteIds, boatClass, courseType = '2000m') => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch('/api/v1/ai-lineup/predict', {
        method: 'POST',
        headers,
        body: JSON.stringify({ athleteIds, boatClass, courseType }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data.error, 'Failed to predict race time'));
      }

      set({ prediction: data.data, loading: false });
      return data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  predictForLineup: async (lineupId, courseType = '2000m') => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const params = new URLSearchParams({ courseType });
      const response = await fetch(`/api/v1/ai-lineup/predict/lineup/${lineupId}?${params}`, {
        method: 'POST',
        headers,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data.error, 'Failed to predict lineup time'));
      }

      set({ prediction: data.data, loading: false });
      return data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  compareLineups: async (lineup1Athletes, lineup2Athletes, boatClass, courseType = '2000m') => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch('/api/v1/ai-lineup/compare', {
        method: 'POST',
        headers,
        body: JSON.stringify({ lineup1Athletes, lineup2Athletes, boatClass, courseType }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data.error, 'Failed to compare lineups'));
      }

      set({ comparison: data.data, loading: false });
      return data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  clearSuggestions: () => set({ suggestions: [] }),
  clearError: () => set({ error: null })
}));
