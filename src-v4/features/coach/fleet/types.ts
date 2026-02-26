/**
 * Fleet equipment types matching Prisma schema.
 *
 * Shell and OarSet interfaces mirror the database models.
 * Input types omit server-managed fields (id, teamId).
 */

// ---------------------------------------------------------------------------
// Enums (matching Prisma schema values)
// ---------------------------------------------------------------------------

export type ShellType = 'EIGHT' | 'FOUR' | 'QUAD' | 'DOUBLE' | 'PAIR' | 'SINGLE';
export type WeightClass = 'HEAVYWEIGHT' | 'LIGHTWEIGHT' | 'OPENWEIGHT';
export type RiggingType = 'SWEEP' | 'SCULL';
export type OarType = 'SWEEP' | 'SCULL';
export type EquipmentStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RETIRED';

// ---------------------------------------------------------------------------
// Display maps for UI labels
// ---------------------------------------------------------------------------

export const SHELL_TYPE_DISPLAY: Record<ShellType, string> = {
  EIGHT: '8+',
  FOUR: '4+/4-',
  QUAD: '4x',
  DOUBLE: '2x',
  PAIR: '2-',
  SINGLE: '1x',
};

export const WEIGHT_CLASS_DISPLAY: Record<WeightClass, string> = {
  HEAVYWEIGHT: 'Heavyweight',
  LIGHTWEIGHT: 'Lightweight',
  OPENWEIGHT: 'Open',
};

export const RIGGING_DISPLAY: Record<RiggingType, string> = {
  SWEEP: 'Sweep',
  SCULL: 'Scull',
};

export const OAR_TYPE_DISPLAY: Record<OarType, string> = {
  SWEEP: 'Sweep',
  SCULL: 'Sculling',
};

export const STATUS_DISPLAY: Record<EquipmentStatus, string> = {
  AVAILABLE: 'Available',
  IN_USE: 'In Use',
  MAINTENANCE: 'Maintenance',
  RETIRED: 'Retired',
};

export const STATUS_COLOR: Record<EquipmentStatus, string> = {
  AVAILABLE: 'text-data-great',
  IN_USE: 'text-accent-teal',
  MAINTENANCE: 'text-data-fair',
  RETIRED: 'text-text-faint',
};

/** Condition dot background color for visual status indicator */
export const STATUS_DOT: Record<EquipmentStatus, string> = {
  AVAILABLE: 'bg-data-great',
  IN_USE: 'bg-accent-teal',
  MAINTENANCE: 'bg-data-fair',
  RETIRED: 'bg-text-faint',
};

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

export interface Shell {
  id: string;
  teamId: string;
  name: string;
  boatClass: string;
  type: ShellType;
  weightClass: WeightClass;
  rigging: RiggingType;
  status: EquipmentStatus;
  notes?: string | null;
}

export interface CreateShellInput {
  name: string;
  boatClass: string;
  type: ShellType;
  weightClass: WeightClass;
  rigging: RiggingType;
  status?: EquipmentStatus;
  notes?: string | null;
}

export type UpdateShellInput = Partial<CreateShellInput>;

// ---------------------------------------------------------------------------
// OarSet
// ---------------------------------------------------------------------------

export interface OarSet {
  id: string;
  teamId: string;
  name: string;
  type: OarType;
  count: number;
  status: EquipmentStatus;
  notes?: string | null;
}

export interface CreateOarSetInput {
  name: string;
  type: OarType;
  count: number;
  status?: EquipmentStatus;
  notes?: string | null;
}

export type UpdateOarSetInput = Partial<CreateOarSetInput>;
