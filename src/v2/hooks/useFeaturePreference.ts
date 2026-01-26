import { useFeaturePreferenceStore } from '../stores/featurePreferenceStore';
import {
  FeatureId,
  FeatureConfig,
  CORE_FEATURES,
  ADVANCED_FEATURES,
  FEATURE_GROUPS,
} from '../types/feature-toggles';

/**
 * Result of useFeaturePreference hook
 */
export interface UseFeaturePreferenceResult {
  /** Whether the feature is currently enabled */
  enabled: boolean;
  /** Toggle the feature on/off (no-op if core feature) */
  toggle: () => void;
  /** Whether this is a core feature (cannot be disabled) */
  isCore: boolean;
}

/**
 * Hook for accessing and controlling a specific feature's state.
 *
 * @param featureId - The feature to check
 * @returns Object with enabled state, toggle function, and isCore flag
 *
 * @example
 * ```tsx
 * function RecruitingSection() {
 *   const { enabled, toggle, isCore } = useFeaturePreference('recruiting');
 *
 *   if (!enabled) return null;
 *
 *   return (
 *     <div>
 *       <h2>Recruiting</h2>
 *       {!isCore && (
 *         <button onClick={toggle}>Disable Recruiting</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFeaturePreference(featureId: FeatureId): UseFeaturePreferenceResult {
  const isFeatureEnabled = useFeaturePreferenceStore((state) => state.isFeatureEnabled);
  const toggleFeature = useFeaturePreferenceStore((state) => state.toggleFeature);

  const enabled = isFeatureEnabled(featureId);
  const isCore = CORE_FEATURES.some((f) => f.id === featureId);

  return {
    enabled,
    toggle: () => toggleFeature(featureId),
    isCore,
  };
}

/**
 * Simplified hook that just returns whether a feature is enabled.
 * Useful for simple conditional rendering without needing toggle functionality.
 *
 * @param featureId - The feature to check
 * @returns Boolean indicating if the feature is enabled
 *
 * @example
 * ```tsx
 * function MatrixSeatRacing() {
 *   const showMatrix = useFeature('matrix-seat-racing');
 *
 *   if (!showMatrix) return null;
 *
 *   return <MatrixView />;
 * }
 * ```
 */
export function useFeature(featureId: FeatureId): boolean {
  return useFeaturePreferenceStore((state) => state.isFeatureEnabled(featureId));
}

/**
 * Feature config with current enabled state
 */
export interface FeatureWithState extends FeatureConfig {
  /** Current enabled state from the store */
  enabled: boolean;
}

/**
 * Hook for accessing all features in a specific group with their current state.
 *
 * @param groupId - The feature group ('core' or 'advanced')
 * @returns Array of feature configs with their current enabled state
 *
 * @example
 * ```tsx
 * function FeatureSettings() {
 *   const advancedFeatures = useFeatureGroup('advanced');
 *
 *   return (
 *     <div>
 *       <h2>Advanced Features</h2>
 *       {advancedFeatures.map(feature => (
 *         <FeatureToggle
 *           key={feature.id}
 *           feature={feature}
 *           enabled={feature.enabled}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFeatureGroup(groupId: 'core' | 'advanced'): FeatureWithState[] {
  const isFeatureEnabled = useFeaturePreferenceStore((state) => state.isFeatureEnabled);

  const features = groupId === 'core' ? CORE_FEATURES : ADVANCED_FEATURES;

  return features.map((feature) => ({
    ...feature,
    enabled: isFeatureEnabled(feature.id),
  }));
}

/**
 * Hook for accessing all feature groups with their features and current state.
 * Useful for building comprehensive feature management UIs.
 *
 * @returns Array of feature groups with their features and enabled states
 *
 * @example
 * ```tsx
 * function FeatureManagement() {
 *   const groups = useFeatureGroups();
 *
 *   return (
 *     <div>
 *       {groups.map(group => (
 *         <section key={group.id}>
 *           <h2>{group.name}</h2>
 *           <p>{group.description}</p>
 *           <FeatureList features={group.features} />
 *         </section>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFeatureGroups() {
  const coreFeatures = useFeatureGroup('core');
  const advancedFeatures = useFeatureGroup('advanced');

  return FEATURE_GROUPS.map((group) => ({
    ...group,
    features: group.id === 'core' ? coreFeatures : advancedFeatures,
  }));
}
