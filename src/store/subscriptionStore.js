import { create } from 'zustand';

// @deprecated This store is deprecated. Use TanStack Query hooks from src/v2/hooks/ instead.
// V1 legacy code still uses this store during migration.
import useAuthStore from './authStore.js';

// @deprecated This store is deprecated. Use TanStack Query hooks from src/v2/hooks/ instead.
// V1 legacy code still uses this store during migration.

const API_URL = '/api/v1';

/**
 * Subscription Store - Manages billing and subscription state
 *
 * Features:
 * - Subscription status and plan management
 * - Usage tracking (athletes, coaches)
 * - Stripe checkout and portal integration
 * - Plan comparison and upgrades
 */
export const useSubscriptionStore = create((set, get) => ({
  // ===== State =====
  subscription: null,
  plans: [],
  usage: null,
  loading: false,
  error: null,

  // ===== Private Helpers =====

  /**
   * Get authorization headers for API requests
   */
  _getAuthHeaders: () => {
    const token = useAuthStore.getState().accessToken;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  /**
   * Handle API response and errors
   */
  _handleResponse: async (response) => {
    try {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Request failed');
      }
      return data;
    } catch (err) {
      if (err instanceof SyntaxError) {
        // Invalid or empty JSON body
        if (!response.ok) {
          throw new Error('Request failed');
        }
        return { success: true };
      }
      throw err;
    }
  },

  // ===== Actions =====

  /**
   * Fetch current subscription and usage data
   */
  fetchSubscription: async () => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/subscriptions`, {
        method: 'GET',
        headers: get()._getAuthHeaders(),
        credentials: 'include',
      });

      const data = await get()._handleResponse(response);

      set({
        subscription: data.data.subscription,
        usage: data.data.usage,
        loading: false,
      });

      return data.data;
    } catch (err) {
      set({ loading: false, error: err.message });
      return { success: false, error: err.message };
    }
  },

  /**
   * Fetch available subscription plans
   */
  fetchPlans: async () => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/subscriptions/plans`, {
        method: 'GET',
        headers: get()._getAuthHeaders(),
        credentials: 'include',
      });

      const data = await get()._handleResponse(response);

      set({
        plans: data.data.plans,
        loading: false,
      });

      return data.data.plans;
    } catch (err) {
      set({ loading: false, error: err.message });
      return { success: false, error: err.message };
    }
  },

  /**
   * Create a Stripe checkout session for subscription
   * @param {string} priceId - Stripe price ID for the plan
   * @returns {Object} - Contains checkout URL to redirect user
   */
  createCheckout: async (priceId) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/subscriptions/checkout`, {
        method: 'POST',
        headers: get()._getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ priceId }),
      });

      const data = await get()._handleResponse(response);

      set({ loading: false });

      // Return the checkout URL for redirect
      return { success: true, url: data.data.url };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { success: false, error: err.message };
    }
  },

  /**
   * Open Stripe billing portal for subscription management
   * @returns {Object} - Contains portal URL to redirect user
   */
  openPortal: async () => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/subscriptions/portal`, {
        method: 'POST',
        headers: get()._getAuthHeaders(),
        credentials: 'include',
      });

      const data = await get()._handleResponse(response);

      set({ loading: false });

      // Return the portal URL for redirect
      return { success: true, url: data.data.url };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { success: false, error: err.message };
    }
  },

  /**
   * Cancel subscription
   * @param {boolean} atPeriodEnd - If true, cancel at end of billing period
   */
  cancelSubscription: async (atPeriodEnd = true) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/subscriptions/cancel`, {
        method: 'POST',
        headers: get()._getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ atPeriodEnd }),
      });

      const data = await get()._handleResponse(response);

      // Update local subscription state
      set({
        subscription: data.data.subscription,
        loading: false,
      });

      return { success: true, subscription: data.data.subscription };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { success: false, error: err.message };
    }
  },

  /**
   * Reactivate a canceled subscription (before period ends)
   */
  reactivateSubscription: async () => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/subscriptions/reactivate`, {
        method: 'POST',
        headers: get()._getAuthHeaders(),
        credentials: 'include',
      });

      const data = await get()._handleResponse(response);

      set({
        subscription: data.data.subscription,
        loading: false,
      });

      return { success: true, subscription: data.data.subscription };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { success: false, error: err.message };
    }
  },

  // ===== Utilities =====

  /**
   * Check if current plan has a specific feature
   */
  hasFeature: (featureName) => {
    const { subscription } = get();
    if (!subscription || !subscription.features) return false;
    return subscription.features[featureName] === true;
  },

  /**
   * Get usage percentage for a resource
   */
  getUsagePercentage: (resourceType) => {
    const { usage } = get();
    if (!usage || !usage[resourceType]) return 0;
    const { used, limit } = usage[resourceType];
    if (limit === -1) return 0; // Unlimited
    if (limit === 0) return 0; // No limit set, return 0 to avoid division by zero
    return Math.min(100, Math.round((used / limit) * 100));
  },

  /**
   * Check if approaching usage limit (80%+)
   */
  isNearLimit: (resourceType) => {
    return get().getUsagePercentage(resourceType) >= 80;
  },

  /**
   * Check if at usage limit
   */
  isAtLimit: (resourceType) => {
    return get().getUsagePercentage(resourceType) >= 100;
  },

  /**
   * Clear error state
   */
  clearError: () => set({ error: null }),

  /**
   * Reset store state
   */
  reset: () => set({
    subscription: null,
    plans: [],
    usage: null,
    loading: false,
    error: null,
  }),
}));

export default useSubscriptionStore;
