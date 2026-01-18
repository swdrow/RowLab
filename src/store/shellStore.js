import { create } from 'zustand';

const useShellStore = create((set, get) => ({
  // State
  shells: [],
  groupedShells: {},
  loading: false,
  error: null,

  // Actions

  /**
   * Fetch all shells for the team
   */
  fetchShells: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/v1/shells', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        set({ shells: data.data.shells, loading: false });
        return data.data.shells;
      } else {
        throw new Error(data.error?.message || 'Failed to fetch shells');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Fetch shells grouped by boat class
   */
  fetchGroupedShells: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/v1/shells/grouped', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        set({ groupedShells: data.data.grouped, loading: false });
        return data.data.grouped;
      } else {
        throw new Error(data.error?.message || 'Failed to fetch grouped shells');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Create a new shell
   */
  createShell: async (shellData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/v1/shells', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(shellData),
      });
      const data = await response.json();

      if (data.success) {
        set((state) => ({
          shells: [...state.shells, data.data.shell],
          loading: false,
        }));
        return data.data.shell;
      } else {
        throw new Error(data.error?.message || 'Failed to create shell');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Update a shell
   */
  updateShell: async (shellId, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/shells/${shellId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await response.json();

      if (data.success) {
        set((state) => ({
          shells: state.shells.map((s) =>
            s.id === shellId ? data.data.shell : s
          ),
          loading: false,
        }));
        return data.data.shell;
      } else {
        throw new Error(data.error?.message || 'Failed to update shell');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Delete a shell
   */
  deleteShell: async (shellId) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/shells/${shellId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        set((state) => ({
          shells: state.shells.filter((s) => s.id !== shellId),
          loading: false,
        }));
        return true;
      } else {
        throw new Error(data.error?.message || 'Failed to delete shell');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Get shells for a specific boat class
   */
  getShellsForBoatClass: (boatClass) => {
    const state = get();
    return state.shells.filter((s) => s.boatClass === boatClass);
  },

  /**
   * Clear error
   */
  clearError: () => set({ error: null }),
}));

export default useShellStore;
