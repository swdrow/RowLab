/**
 * Racing Page Configuration
 * Constants and options for the racing module
 */
import { Calendar, Trophy, Flag } from 'lucide-react';

/**
 * Tab configuration
 */
export const TABS = [
  { id: 'regattas', label: 'Regattas', icon: Calendar, color: 'blue' },
  { id: 'raceday', label: 'Race Day', icon: Flag, color: 'green' },
  { id: 'rankings', label: 'Rankings', icon: Trophy, color: 'orange' },
];

/**
 * Tab color styles
 */
export const tabColorConfig = {
  blue: {
    active: 'bg-blade-blue/10 text-blade-blue border-blade-blue/30 shadow-[0_0_15px_rgba(0,112,243,0.15)]',
    inactive: 'text-text-muted hover:text-text-secondary hover:bg-white/[0.02]',
  },
  green: {
    active: 'bg-success-green/10 text-success-green border-success-green/30 shadow-[0_0_15px_rgba(34,197,94,0.15)]',
    inactive: 'text-text-muted hover:text-text-secondary hover:bg-white/[0.02]',
  },
  orange: {
    active: 'bg-warning-orange/10 text-warning-orange border-warning-orange/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    inactive: 'text-text-muted hover:text-text-secondary hover:bg-white/[0.02]',
  },
};

/**
 * Course type options for regattas
 */
export const courseTypeOptions = [
  { value: '2000m', label: '2000m Sprint' },
  { value: '1500m', label: '1500m' },
  { value: 'head', label: 'Head Race' },
];

/**
 * Boat class options for races
 */
export const boatClassOptions = [
  { value: '8+', label: '8+' },
  { value: '4+', label: '4+' },
  { value: '4-', label: '4-' },
  { value: '4x', label: '4x' },
  { value: '2-', label: '2-' },
  { value: '2x', label: '2x' },
  { value: '1x', label: '1x' },
];

/**
 * Default form state for new regatta
 */
export const getDefaultRegattaForm = () => ({
  name: '',
  location: '',
  date: new Date().toISOString().split('T')[0],
  courseType: '2000m',
  description: '',
});

/**
 * Default form state for new race
 */
export const getDefaultRaceForm = () => ({
  eventName: '',
  boatClass: '8+',
  distanceMeters: 2000,
  isHeadRace: false,
});
