import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = '/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (username, password) => {
        set({ isLoading: true, error: null });

        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || 'Login failed');
          }

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return { success: true };
        } catch (err) {
          set({
            isLoading: false,
            error: err.message,
          });
          return { success: false, error: err.message };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      verify: async () => {
        const token = get().token;
        if (!token) {
          set({ isAuthenticated: false });
          return false;
        }

        try {
          const res = await fetch(`${API_URL}/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!res.ok) {
            throw new Error('Token invalid');
          }

          const data = await res.json();
          set({
            user: data.user,
            isAuthenticated: true,
          });
          return true;
        } catch (err) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          return false;
        }
      },

      clearError: () => set({ error: null }),

      // Helper for authenticated requests
      getAuthHeaders: () => {
        const token = get().token;
        return token ? { 'Authorization': `Bearer ${token}` } : {};
      },
    }),
    {
      name: 'rowlab-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);

export default useAuthStore;
