import { create } from 'zustand';

/**
 * Subscription store stub
 * TODO(#phase-billing): Replace with real Stripe integration
 */
export const useSubscriptionStore = create((set) => ({
  subscription: {
    planId: 'free',
    status: 'active',
    currentPeriodEnd: null,
  },
  usage: {
    athletes: { used: 0, limit: 15 },
    coaches: { used: 0, limit: 1 },
  },
  loading: false,
  fetchSubscription: () => {},
  openPortal: async () => ({ success: false, error: 'Billing portal not yet configured' }),
}));
