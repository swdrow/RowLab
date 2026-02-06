/**
 * @deprecated Phase 25-04
 *
 * This V1 Zustand store has been replaced by V2 TanStack Query hooks.
 * V1 legacy components still reference this store. Do NOT add new functionality here.
 *
 * TODO(phase-25-08): Complete V1 → V2 migration and delete this file
 */

import { create } from 'zustand';

// Helper to extract error message from various error formats
const getErrorMessage = (error, fallback = 'An error occurred') => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.error) return getErrorMessage(error.error, fallback);
  return fallback;
};

export const useTelemetryStore = create((set, get) => ({
  telemetryData: [],
  sessionData: [],
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

  fetchByAthlete: async (athleteId, options = {}) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const params = new URLSearchParams();
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);
      if (options.limit) params.append('limit', options.limit);

      const queryString = params.toString();
      const url = `/api/v1/telemetry/athlete/${athleteId}${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data.error, 'Failed to fetch telemetry'));
      }

      set({ telemetryData: data.data || [], loading: false });
      return data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchBySession: async (date) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/telemetry/session/${date}`, { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data.error, 'Failed to fetch session telemetry'));
      }

      set({ sessionData: data.data || [], loading: false });
      return data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  importTelemetry: async (sessionDate, source, entries) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch('/api/v1/telemetry/import', {
        method: 'POST',
        headers,
        body: JSON.stringify({ sessionDate, source, entries }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data.error, 'Failed to import telemetry'));
      }

      set({ loading: false });
      return data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteEntry: async (id) => {
    set({ loading: true });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/telemetry/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(getErrorMessage(data.error, 'Failed to delete telemetry'));
      }

      set(state => ({
        telemetryData: state.telemetryData.filter(t => t.id !== id),
        sessionData: state.sessionData.filter(t => t.id !== id)
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null })
}));
