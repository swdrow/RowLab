/**
 * AI Lineup Optimizer Configuration
 * Constants and configurations for the lineup optimizer
 */

/**
 * Boat class configurations
 */
export const BOAT_CLASSES = [
  { id: '8+', name: 'Eight (8+)', seats: 8, hasCoxswain: true },
  { id: '4+', name: 'Four with Cox (4+)', seats: 4, hasCoxswain: true },
  { id: '4-', name: 'Four (4-)', seats: 4, hasCoxswain: false },
  { id: '2-', name: 'Pair (2-)', seats: 2, hasCoxswain: false },
  { id: '1x', name: 'Single (1x)', seats: 1, hasCoxswain: false },
];

/**
 * Side preference options
 */
export const SIDE_OPTIONS = [
  { value: 'Both', label: 'Both Sides' },
  { value: 'Port', label: 'Port Only' },
  { value: 'Starboard', label: 'Starboard Only' },
];

/**
 * Default optimizer settings
 */
export const OPTIMIZER_DEFAULTS = {
  numSuggestions: 5,
  populationSize: 50,
  generations: 100,
};
