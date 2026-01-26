import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  FeatureId,
  FeaturePreferenceState,
  ALL_FEATURES,
  CORE_FEATURES,
} from '../types/feature-toggles';

/**
 * Initialize the default enabled state for all features
 */
const initializeDefaultFeatures = (): Record<FeatureId, boolean> => {
  const defaults: Partial<Record<FeatureId, boolean>> = {};
  ALL_FEATURES.forEach((feature) => {
    defaults[feature.id] = feature.defaultEnabled;
  });
  return defaults as Record<FeatureId, boolean>;
};

/**
 * Check if a feature is a core feature (always enabled)
 */
const isCoreFeature = (featureId: FeatureId): boolean => {
  return CORE_FEATURES.some((f) => f.id === featureId);
};

/**
 * Feature preference store with localStorage persistence.
 *
 * This store manages which advanced features are enabled for the team.
 * Core features are always enabled and cannot be toggled off.
 *
 * @example
 * ```tsx
 * const { isFeatureEnabled, toggleFeature } = useFeaturePreferenceStore();
 *
 * // Check if recruiting is enabled
 * const showRecruiting = isFeatureEnabled('recruiting');
 *
 * // Toggle an advanced feature
 * toggleFeature('recruiting');
 * ```
 */
export const useFeaturePreferenceStore = create<FeaturePreferenceState>()(
  persist(
    (set, get) => ({
      enabledFeatures: initializeDefaultFeatures(),

      toggleFeature: (featureId: FeatureId) => {
        // Core features cannot be toggled
        if (isCoreFeature(featureId)) {
          return;
        }

        set((state) => ({
          enabledFeatures: {
            ...state.enabledFeatures,
            [featureId]: !state.enabledFeatures[featureId],
          },
        }));
      },

      enableFeature: (featureId: FeatureId) => {
        // Core features are already enabled, no need to update
        if (isCoreFeature(featureId)) {
          return;
        }

        set((state) => ({
          enabledFeatures: {
            ...state.enabledFeatures,
            [featureId]: true,
          },
        }));
      },

      disableFeature: (featureId: FeatureId) => {
        // Core features cannot be disabled
        if (isCoreFeature(featureId)) {
          return;
        }

        set((state) => ({
          enabledFeatures: {
            ...state.enabledFeatures,
            [featureId]: false,
          },
        }));
      },

      resetToDefaults: () => {
        set({ enabledFeatures: initializeDefaultFeatures() });
      },

      isFeatureEnabled: (featureId: FeatureId): boolean => {
        // Core features are ALWAYS enabled, regardless of store state
        if (isCoreFeature(featureId)) {
          return true;
        }

        // For advanced features, check the store state
        return get().enabledFeatures[featureId] ?? false;
      },
    }),
    {
      name: 'rowlab-feature-preferences',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : ({} as Storage)
      ),
      // Only persist the enabledFeatures state
      partialize: (state) => ({ enabledFeatures: state.enabledFeatures }),
    }
  )
);
