/**
 * Equipment assignment and conflict types for Phase 18 - BOAT-03, BOAT-04
 */

/**
 * Equipment assignment - links equipment to lineups/sessions
 */
export interface EquipmentAssignment {
  id: string;
  teamId: string;
  lineupId?: string | null;
  sessionId?: string | null;
  shellId?: string | null;
  oarSetId?: string | null;
  assignedDate: string; // ISO date string (YYYY-MM-DD)
  notes?: string | null;
  createdAt: string;
  /** Resolved names for display */
  shellName?: string | null;
  oarSetName?: string | null;
  lineupName?: string | null;
}

/**
 * Input for creating equipment assignment
 */
export interface EquipmentAssignmentInput {
  lineupId?: string | null;
  sessionId?: string | null;
  shellId?: string | null;
  oarSetId?: string | null;
  assignedDate: string;
  notes?: string | null;
}

/**
 * Equipment conflict types
 */
export type ConflictType = 'double_booking' | 'unavailable' | 'maintenance';

/**
 * Equipment conflict - detected when equipment is double-booked
 */
export interface EquipmentConflict {
  type: ConflictType;
  /** ID of the equipment (shell or oar set) */
  equipmentId: string;
  /** Name for display */
  equipmentName: string;
  /** Type of equipment */
  equipmentType: 'shell' | 'oarSet';
  /** ID of the conflicting lineup/session */
  conflictingId: string;
  /** Name of conflicting lineup/session */
  conflictingName: string;
  /** Date of conflict */
  conflictDate: string;
  /** Human-readable message */
  message: string;
}

/**
 * Shell with extended info for equipment picker
 */
export interface ShellWithStatus {
  id: string;
  name: string;
  boatClass: string;
  type: 'EIGHT' | 'FOUR' | 'QUAD' | 'DOUBLE' | 'PAIR' | 'SINGLE';
  weightClass: 'HEAVYWEIGHT' | 'LIGHTWEIGHT' | 'OPENWEIGHT';
  rigging: 'SWEEP' | 'SCULL';
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RETIRED';
  notes?: string | null;
  /** Is this shell assigned for the target date? */
  isAssignedForDate: boolean;
  /** Conflicting assignment if any */
  conflict?: EquipmentConflict | null;
  /** Rigging profile if exists */
  hasRiggingProfile: boolean;
}

/**
 * Oar set with extended info for equipment picker
 */
export interface OarSetWithStatus {
  id: string;
  name: string;
  type: 'SWEEP' | 'SCULL';
  count: number;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RETIRED';
  notes?: string | null;
  /** Is this oar set assigned for the target date? */
  isAssignedForDate: boolean;
  /** Conflicting assignment if any */
  conflict?: EquipmentConflict | null;
}

/**
 * Equipment availability check result
 */
export interface EquipmentAvailability {
  date: string;
  shells: ShellWithStatus[];
  oarSets: OarSetWithStatus[];
  /** Total conflicts found */
  conflictCount: number;
}

/**
 * Historical lineup search filters
 */
export interface LineupSearchFilters {
  /** Filter by athlete IDs (any match) */
  athleteIds?: string[];
  /** Minimum number of specified athletes that must be in lineup */
  minAthletes?: number;
  /** Filter by boat classes */
  boatClasses?: string[];
  /** Filter by shell names */
  shellNames?: string[];
  /** Date range start */
  startDate?: string;
  /** Date range end */
  endDate?: string;
  /** Search in lineup name */
  nameSearch?: string;
  /** Sort by */
  sortBy?: 'date' | 'name' | 'createdAt';
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Lineup with metadata for historical search results
 */
export interface LineupSearchResult {
  id: string;
  name: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  /** Number of athletes in this lineup */
  athleteCount: number;
  /** Boat classes used */
  boatClasses: string[];
  /** Shells used (if any) */
  shellNames: string[];
  /** Match score for "at least N athletes" queries */
  matchedAthleteCount?: number;
}
