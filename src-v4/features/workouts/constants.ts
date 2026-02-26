/**
 * Workout constants: sport configuration, source badges, and type mappings.
 */

export const SPORT_CONFIG = {
  RowErg: {
    type: 'erg',
    machineType: 'rower',
    icon: 'Waves',
    color: 'machine-rower',
    label: 'RowErg',
    paceUnit: '/500m',
  },
  SkiErg: {
    type: 'erg',
    machineType: 'skierg',
    icon: 'Mountain',
    color: 'data-good',
    label: 'SkiErg',
    paceUnit: '/500m',
  },
  BikeErg: {
    type: 'erg',
    machineType: 'bikerg',
    icon: 'Bike',
    color: 'data-warning',
    label: 'BikeErg',
    paceUnit: '/1000m',
  },
  Running: {
    type: 'cardio',
    machineType: null,
    icon: 'Footprints',
    color: 'data-excellent',
    label: 'Running',
    paceUnit: '/km',
  },
  Cycling: {
    type: 'cardio',
    machineType: null,
    icon: 'Bike',
    color: 'data-warning',
    label: 'Cycling',
    paceUnit: null,
  },
  Swimming: {
    type: 'cardio',
    machineType: null,
    icon: 'Waves',
    color: 'machine-otw',
    label: 'Swimming',
    paceUnit: '/100m',
  },
  Strength: {
    type: 'strength',
    machineType: null,
    icon: 'Dumbbell',
    color: 'data-poor',
    label: 'Strength',
    paceUnit: null,
  },
  Yoga: {
    type: 'other',
    machineType: null,
    icon: 'Heart',
    color: 'text-dim',
    label: 'Yoga',
    paceUnit: null,
  },
  Other: {
    type: 'other',
    machineType: null,
    icon: 'Activity',
    color: 'text-dim',
    label: 'Other',
    paceUnit: null,
  },
} as const;

export type SportType = keyof typeof SPORT_CONFIG;

export const SPORT_LIST = Object.keys(SPORT_CONFIG) as SportType[];

export const SOURCE_CONFIG = {
  manual: { label: 'Manual', icon: 'Pencil', color: 'text-faint' },
  concept2: { label: 'Concept2', icon: 'Zap', color: 'accent-teal' },
  strava: { label: 'Strava', icon: 'Activity', color: 'data-warning' },
  garmin: { label: 'Garmin', icon: 'Watch', color: 'data-good' },
} as const;

export type SourceType = keyof typeof SOURCE_CONFIG;
