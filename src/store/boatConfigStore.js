import { create } from 'zustand';

const useBoatConfigStore = create((set, get) => ({
  // State
  configs: [],
  standardConfigs: [],
  loading: false,
  error: null,

  // Actions

  /**
   * Fetch all boat configs (standard + custom)
   */
  fetchConfigs: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/v1/boat-configs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        const configs = data.data.configs;
        set({
          configs,
          standardConfigs: configs.filter((c) => !c.isCustom),
          loading: false,
        });
        return configs;
      } else {
        throw new Error(data.error?.message || 'Failed to fetch configs');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Fetch only standard configs (no auth required)
   */
  fetchStandardConfigs: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/v1/boat-configs/standard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        set({ standardConfigs: data.data.configs, loading: false });
        return data.data.configs;
      } else {
        throw new Error(data.error?.message || 'Failed to fetch standard configs');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Create a new custom boat config
   */
  createConfig: async (configData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/v1/boat-configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(configData),
      });
      const data = await response.json();

      if (data.success) {
        const newConfig = { ...data.data.config, isCustom: true };
        set((state) => ({
          configs: [...state.configs, newConfig],
          loading: false,
        }));
        return newConfig;
      } else {
        throw new Error(data.error?.message || 'Failed to create config');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Update a custom boat config
   */
  updateConfig: async (configId, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/boat-configs/${configId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await response.json();

      if (data.success) {
        const updatedConfig = { ...data.data.config, isCustom: true };
        set((state) => ({
          configs: state.configs.map((c) =>
            c.id === configId ? updatedConfig : c
          ),
          loading: false,
        }));
        return updatedConfig;
      } else {
        throw new Error(data.error?.message || 'Failed to update config');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Delete a custom boat config
   */
  deleteConfig: async (configId) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/boat-configs/${configId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        set((state) => ({
          configs: state.configs.filter((c) => c.id !== configId),
          loading: false,
        }));
        return true;
      } else {
        throw new Error(data.error?.message || 'Failed to delete config');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Get config by name
   */
  getConfigByName: (name) => {
    const state = get();
    return state.configs.find((c) => c.name === name);
  },

  /**
   * Clear error
   */
  clearError: () => set({ error: null }),
}));

export default useBoatConfigStore;
