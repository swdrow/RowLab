/**
 * Feature Toggle System Types
 *
 * This module defines the type system for RowLab's progressive feature unlock system.
 *
 * **Core Features**: Always visible and enabled. These are essential features that every team needs.
 * Examples: roster management, attendance tracking, basic lineup builder
 *
 * **Advanced Features**: Optional features that teams can enable based on their needs.
 * Examples: advanced seat racing analytics, NCAA compliance tracking, recruiting tools
 *
 * The distinction allows teams to keep their UI clean while still having access to
 * powerful tools when they need them.
 */

/**
 * All available feature IDs in the system.
 *
 * Core features (always on):
 * - roster: Basic athlete roster management
 * - attendance: Practice and event attendance tracking
 * - lineup-builder: Create and manage boat lineups
 * - erg-data: Erg test results and performance tracking
 * - training-calendar: Training schedule and session planning
 * - basic-seat-racing: Simple seat race management
 *
 * Advanced features (opt-in):
 * - matrix-seat-racing: Matrix-style seat racing with multiple comparisons
 * - bradley-terry: Bradley-Terry statistical model for rankings
 * - periodization: Periodized training plan creation
 * - tss-tracking: Training Stress Score tracking
 * - ncaa-compliance: NCAA hour tracking and compliance
 * - racing-regattas: Regatta management and race day tools
 * - recruiting: Recruiting pipeline and prospect management
 */
export type FeatureId =
  // Core features (always enabled)
  | 'roster'
  | 'attendance'
  | 'lineup-builder'
  | 'erg-data'
  | 'training-calendar'
  | 'basic-seat-racing'
  // Advanced features (toggleable)
  | 'matrix-seat-racing'
  | 'bradley-terry'
  | 'periodization'
  | 'tss-tracking'
  | 'ncaa-compliance'
  | 'racing-regattas'
  | 'recruiting'
  | 'gamification';

/**
 * Configuration for a single feature
 */
export interface FeatureConfig {
  /** Unique identifier for the feature */
  id: FeatureId;
  /** Display name shown in UI */
  name: string;
  /** Description of what this feature does */
  description: string;
  /** Which group this feature belongs to */
  group: 'core' | 'advanced';
  /** Lucide icon name (optional) */
  icon?: string;
  /** Whether this feature is enabled by default */
  defaultEnabled: boolean;
}

/**
 * A group of related features
 */
export interface FeatureGroup {
  /** Group identifier */
  id: 'core' | 'advanced';
  /** Display name for the group */
  name: string;
  /** Description of this feature group */
  description: string;
  /** Feature IDs belonging to this group */
  features: FeatureId[];
}

/**
 * Store state for feature preferences
 */
export interface FeaturePreferenceState {
  /** Map of feature IDs to their enabled state */
  enabledFeatures: Record<FeatureId, boolean>;

  // Actions
  /** Toggle a feature on/off (only works for advanced features) */
  toggleFeature: (featureId: FeatureId) => void;
  /** Enable a feature (only works for advanced features) */
  enableFeature: (featureId: FeatureId) => void;
  /** Disable a feature (only works for advanced features) */
  disableFeature: (featureId: FeatureId) => void;
  /** Reset all features to their default enabled state */
  resetToDefaults: () => void;

  // Computed
  /** Check if a feature is enabled (core features always return true) */
  isFeatureEnabled: (featureId: FeatureId) => boolean;
}

/**
 * Core features - always visible and enabled
 */
export const CORE_FEATURES: FeatureConfig[] = [
  {
    id: 'roster',
    name: 'Roster Management',
    description: 'Manage your team roster, athlete profiles, and basic information',
    group: 'core',
    icon: 'Users',
    defaultEnabled: true,
  },
  {
    id: 'attendance',
    name: 'Attendance Tracking',
    description: 'Track practice and event attendance',
    group: 'core',
    icon: 'CheckSquare',
    defaultEnabled: true,
  },
  {
    id: 'lineup-builder',
    name: 'Lineup Builder',
    description: 'Create and manage boat lineups',
    group: 'core',
    icon: 'Layout',
    defaultEnabled: true,
  },
  {
    id: 'erg-data',
    name: 'Erg Data',
    description: 'Track erg test results and performance metrics',
    group: 'core',
    icon: 'Activity',
    defaultEnabled: true,
  },
  {
    id: 'training-calendar',
    name: 'Training Calendar',
    description: 'Plan and schedule training sessions',
    group: 'core',
    icon: 'Calendar',
    defaultEnabled: true,
  },
  {
    id: 'basic-seat-racing',
    name: 'Basic Seat Racing',
    description: 'Simple seat race management and results',
    group: 'core',
    icon: 'GitCompare',
    defaultEnabled: true,
  },
];

/**
 * Advanced features - optional, can be toggled on/off
 */
export const ADVANCED_FEATURES: FeatureConfig[] = [
  {
    id: 'matrix-seat-racing',
    name: 'Matrix Seat Racing',
    description: 'Advanced matrix-style seat racing with multiple comparisons',
    group: 'advanced',
    icon: 'Grid3x3',
    defaultEnabled: false,
  },
  {
    id: 'bradley-terry',
    name: 'Bradley-Terry Rankings',
    description: 'Statistical ranking model for athlete performance',
    group: 'advanced',
    icon: 'TrendingUp',
    defaultEnabled: false,
  },
  {
    id: 'periodization',
    name: 'Training Periodization',
    description: 'Create periodized training plans with macro/meso/micro cycles',
    group: 'advanced',
    icon: 'Layers',
    defaultEnabled: false,
  },
  {
    id: 'tss-tracking',
    name: 'TSS Tracking',
    description: 'Training Stress Score tracking and load management',
    group: 'advanced',
    icon: 'Gauge',
    defaultEnabled: false,
  },
  {
    id: 'ncaa-compliance',
    name: 'NCAA Compliance',
    description: 'Track practice hours and NCAA compliance requirements',
    group: 'advanced',
    icon: 'Shield',
    defaultEnabled: false,
  },
  {
    id: 'racing-regattas',
    name: 'Racing & Regattas',
    description: 'Manage regattas and race day operations',
    group: 'advanced',
    icon: 'Trophy',
    defaultEnabled: false,
  },
  {
    id: 'recruiting',
    name: 'Recruiting',
    description: 'Recruiting pipeline and prospect management',
    group: 'advanced',
    icon: 'UserPlus',
    defaultEnabled: false,
  },
  {
    id: 'gamification',
    name: 'Gamification',
    description: 'Achievements, personal records, team challenges, and engagement features',
    group: 'advanced',
    icon: 'Trophy',
    defaultEnabled: false,
  },
];

/**
 * All features combined
 */
export const ALL_FEATURES: FeatureConfig[] = [...CORE_FEATURES, ...ADVANCED_FEATURES];

/**
 * Feature groups for organizational purposes
 */
export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    id: 'core',
    name: 'Core Features',
    description: 'Essential features available to all teams',
    features: CORE_FEATURES.map((f) => f.id),
  },
  {
    id: 'advanced',
    name: 'Advanced Features',
    description: 'Optional advanced features you can enable based on your needs',
    features: ADVANCED_FEATURES.map((f) => f.id),
  },
];
