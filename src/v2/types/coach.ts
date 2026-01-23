/**
 * Coach feature types matching Prisma schema
 */

// Whiteboard types
export interface Whiteboard {
  id: string;
  teamId: string;
  date: string; // ISO8601 date
  content: string; // Markdown content
  authorId: string;
  author: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Shell types (match Prisma schema)
export type ShellType = 'EIGHT' | 'FOUR' | 'QUAD' | 'DOUBLE' | 'PAIR' | 'SINGLE';
export type WeightClass = 'HEAVYWEIGHT' | 'LIGHTWEIGHT' | 'OPENWEIGHT';
export type RiggingType = 'SWEEP' | 'SCULL';
export type EquipmentStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RETIRED';

export interface Shell {
  id: string;
  teamId: string;
  name: string;
  boatClass: string;
  type: ShellType;
  weightClass: WeightClass;
  rigging: RiggingType;
  status: EquipmentStatus;
  notes?: string;
}

// OarSet types
export type OarType = 'SWEEP' | 'SCULL';

export interface OarSet {
  id: string;
  teamId: string;
  name: string;
  type: OarType;
  count: number;
  status: EquipmentStatus;
  notes?: string;
}

// Availability types
export type AvailabilitySlot = 'AVAILABLE' | 'UNAVAILABLE' | 'MAYBE' | 'NOT_SET';

export interface AvailabilityDay {
  date: string;
  morningSlot: AvailabilitySlot;
  eveningSlot: AvailabilitySlot;
  notes?: string;
}

export interface AthleteAvailability {
  athleteId: string;
  athleteName: string;
  dates: AvailabilityDay[];
}

// Reuse ApiResponse from dashboard types
export type { ApiResponse } from './dashboard';
