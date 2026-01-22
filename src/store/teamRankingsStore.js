import { create } from 'zustand';
import { handleApiResponse } from '@utils/api';

// Helper to extract error message from various error formats
const getErrorMessage = (error, fallback = 'An error occurred') => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.error) return getErrorMessage(error.error, fallback);
  return fallback;
};

const API_BASE = '/api/v1/team-rankings';

const useTeamRankingsStore = create((set) => ({
  rankings: [],
  boatClasses: [],
  headToHead: null,
  loading: false,
  error: null,

  fetchBoatClasses: async (season) => {
    set({ loading: true, error: null });
    try {
      const params = season ? `?season=${encodeURIComponent(season)}` : '';
      const res = await fetch(`${API_BASE}/boat-classes${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const data = await handleApiResponse(res, 'Failed to fetch boat classes');
      set({ boatClasses: data.data.boatClasses, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchRankings: async (boatClass, season) => {
    set({ loading: true, error: null });
    try {
      const params = season ? `?season=${encodeURIComponent(season)}` : '';
      const res = await fetch(`${API_BASE}/rankings/${encodeURIComponent(boatClass)}${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await handleApiResponse(res, 'Failed to fetch rankings');
      set({ rankings: data.data.rankings, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchHeadToHead: async (opponent, boatClass, season) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams({ opponent, boatClass });
      if (season) params.append('season', season);

      const res = await fetch(`${API_BASE}/head-to-head?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(getErrorMessage(data.error, 'Request failed'));
      set({ headToHead: data.data.comparison, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useTeamRankingsStore;
