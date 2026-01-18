import { create } from 'zustand';

/**
 * Zustand store for managing seat race sessions
 *
 * Features:
 * - CRUD operations for seat race sessions
 * - Piece and boat management within sessions
 * - Analysis and processing of race results
 */
const useSeatRaceStore = create((set, get) => ({
  // Data
  sessions: [],
  currentSession: null,
  analysis: null,

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
  // Session CRUD Operations
  // ============================================

  /**
   * Fetch all seat race sessions
   */
  fetchSessions: async () => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch('/api/v1/seat-races', { headers });
      const data = await response.json();

      if (data.success) {
        set({ sessions: data.data.sessions || data.data || [], loading: false });
        return data.data.sessions || data.data;
      }
      throw new Error(data.error?.message || 'Failed to fetch sessions');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Fetch a single session by ID
   */
  fetchSession: async (sessionId) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/seat-races/${sessionId}`, { headers });
      const data = await response.json();

      if (data.success) {
        const session = data.data.session || data.data;
        set({ currentSession: session, loading: false });
        return session;
      }
      throw new Error(data.error?.message || 'Failed to fetch session');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Create a new seat race session
   */
  createSession: async (sessionData) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch('/api/v1/seat-races', {
        method: 'POST',
        headers,
        body: JSON.stringify(sessionData),
      });
      const data = await response.json();

      if (data.success) {
        const session = data.data.session || data.data;
        set((state) => ({
          sessions: [...state.sessions, session],
          currentSession: session,
          loading: false,
        }));
        return session;
      }
      throw new Error(data.error?.message || 'Failed to create session');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Update an existing session
   */
  updateSession: async (sessionId, data) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/seat-races/${sessionId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      });
      const responseData = await response.json();

      if (responseData.success) {
        const session = responseData.data.session || responseData.data;
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? session : s
          ),
          currentSession:
            state.currentSession?.id === sessionId
              ? session
              : state.currentSession,
          loading: false,
        }));
        return session;
      }
      throw new Error(responseData.error?.message || 'Failed to update session');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Delete a session
   */
  deleteSession: async (sessionId) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/seat-races/${sessionId}`, {
        method: 'DELETE',
        headers,
      });
      const data = await response.json();

      if (data.success) {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          currentSession:
            state.currentSession?.id === sessionId
              ? null
              : state.currentSession,
          loading: false,
        }));
        return true;
      }
      throw new Error(data.error?.message || 'Failed to delete session');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ============================================
  // Piece Operations
  // ============================================

  /**
   * Add a piece to a session
   */
  addPiece: async (sessionId, pieceData) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/seat-races/${sessionId}/pieces`, {
        method: 'POST',
        headers,
        body: JSON.stringify(pieceData),
      });
      const data = await response.json();

      if (data.success) {
        const piece = data.data.piece || data.data;
        // Update current session if it matches
        set((state) => {
          if (state.currentSession?.id === sessionId) {
            const updatedSession = {
              ...state.currentSession,
              pieces: [...(state.currentSession.pieces || []), piece],
            };
            return {
              currentSession: updatedSession,
              sessions: state.sessions.map((s) =>
                s.id === sessionId ? updatedSession : s
              ),
              loading: false,
            };
          }
          return { loading: false };
        });
        return piece;
      }
      throw new Error(data.error?.message || 'Failed to add piece');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ============================================
  // Boat Operations
  // ============================================

  /**
   * Add a boat to a piece
   */
  addBoat: async (pieceId, boatData) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/seat-races/pieces/${pieceId}/boats`, {
        method: 'POST',
        headers,
        body: JSON.stringify(boatData),
      });
      const data = await response.json();

      if (data.success) {
        const boat = data.data.boat || data.data;
        // Update current session pieces with new boat
        set((state) => {
          if (state.currentSession?.pieces) {
            const updatedPieces = state.currentSession.pieces.map((p) => {
              if (p.id === pieceId) {
                return {
                  ...p,
                  boats: [...(p.boats || []), boat],
                };
              }
              return p;
            });
            const updatedSession = {
              ...state.currentSession,
              pieces: updatedPieces,
            };
            return {
              currentSession: updatedSession,
              sessions: state.sessions.map((s) =>
                s.id === state.currentSession.id ? updatedSession : s
              ),
              loading: false,
            };
          }
          return { loading: false };
        });
        return boat;
      }
      throw new Error(data.error?.message || 'Failed to add boat');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Update boat finish time
   */
  updateBoatTime: async (boatId, finishTimeSeconds) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/seat-races/boats/${boatId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ finishTimeSeconds }),
      });
      const data = await response.json();

      if (data.success) {
        const updatedBoat = data.data.boat || data.data;
        // Update boat in current session
        set((state) => {
          if (state.currentSession?.pieces) {
            const updatedPieces = state.currentSession.pieces.map((piece) => ({
              ...piece,
              boats: (piece.boats || []).map((boat) =>
                boat.id === boatId ? updatedBoat : boat
              ),
            }));
            const updatedSession = {
              ...state.currentSession,
              pieces: updatedPieces,
            };
            return {
              currentSession: updatedSession,
              sessions: state.sessions.map((s) =>
                s.id === state.currentSession.id ? updatedSession : s
              ),
              loading: false,
            };
          }
          return { loading: false };
        });
        return updatedBoat;
      }
      throw new Error(data.error?.message || 'Failed to update boat time');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ============================================
  // Analysis Operations
  // ============================================

  /**
   * Get analysis for a session
   */
  analyzeSession: async (sessionId) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/seat-races/${sessionId}/analysis`, {
        headers,
      });
      const data = await response.json();

      if (data.success) {
        const analysis = data.data.analysis || data.data;
        set({ analysis, loading: false });
        return analysis;
      }
      throw new Error(data.error?.message || 'Failed to analyze session');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Process session (calculate rankings, etc.)
   */
  processSession: async (sessionId) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/seat-races/${sessionId}/process`, {
        method: 'POST',
        headers,
      });
      const data = await response.json();

      if (data.success) {
        const result = data.data;
        // Optionally refresh the session to get updated data
        await get().fetchSession(sessionId);
        return result;
      }
      throw new Error(data.error?.message || 'Failed to process session');
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
      sessions: [],
      currentSession: null,
      analysis: null,
      loading: false,
      error: null,
    });
  },

  /**
   * Set current session locally (without API call)
   */
  setCurrentSession: (session) => {
    set({ currentSession: session });
  },

  /**
   * Clear current session
   */
  clearCurrentSession: () => {
    set({ currentSession: null, analysis: null });
  },
}));

export default useSeatRaceStore;
