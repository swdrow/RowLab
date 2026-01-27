/**
 * Rigging types for Phase 18 - BOAT-02
 *
 * Standard values (from World Rowing / Concept2):
 * - Spread (sweep): 83-87 cm
 * - Span (scull): 158-160 cm (2x spread)
 * - Catch angle: -58° (sweep), -60° (scull)
 * - Finish angle: 33° (sweep), 35° (scull)
 * - Oar length: Sweep 362-378 cm, Scull 274-292 cm
 * - Inboard: Sweep 112-116 cm, Scull 87-89 cm
 * - Pitch: 4° (modern standard)
 * - Gate height: Sweep 170±15 mm, Scull 160±15 mm
 */

/**
 * Core rigging measurements - stored as JSON in database
 */
export interface RiggingDefaults {
  /** Spread in cm (sweep boats, typical: 83-87) */
  spread?: number;
  /** Span in cm (sculling boats, typical: 158-160) */
  span?: number;
  /** Catch angle in degrees (typical: -58 sweep, -60 scull) */
  catchAngle?: number;
  /** Finish angle in degrees (typical: 33 sweep, 35 scull) */
  finishAngle?: number;
  /** Oar length in cm (sweep: 362-378, scull: 274-292) */
  oarLength?: number;
  /** Inboard length in cm (sweep: 112-116, scull: 87-89) */
  inboard?: number;
  /** Pitch in degrees (modern standard: 4) */
  pitch?: number;
  /** Gate height in mm from seat (sweep: 170±15, scull: 160±15) */
  gateHeight?: number;
}

/**
 * Per-seat rigging overrides
 */
export type PerSeatRigging = Record<number, Partial<RiggingDefaults>>;

/**
 * Full rigging profile linked to a shell
 */
export interface RiggingProfile {
  id: string;
  shellId: string;
  teamId: string;
  defaults: RiggingDefaults;
  perSeat?: PerSeatRigging | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating/updating rigging profile
 */
export interface RiggingProfileInput {
  shellId: string;
  defaults: RiggingDefaults;
  perSeat?: PerSeatRigging | null;
  notes?: string | null;
}

/**
 * Default rigging values by boat class
 */
export const DEFAULT_RIGGING: Record<string, RiggingDefaults> = {
  '8+': {
    spread: 85,
    catchAngle: -58,
    finishAngle: 33,
    oarLength: 372,
    inboard: 114,
    pitch: 4,
    gateHeight: 170,
  },
  '4+': {
    spread: 86,
    catchAngle: -58,
    finishAngle: 33,
    oarLength: 372,
    inboard: 114,
    pitch: 4,
    gateHeight: 170,
  },
  '4-': {
    spread: 86,
    catchAngle: -58,
    finishAngle: 33,
    oarLength: 372,
    inboard: 114,
    pitch: 4,
    gateHeight: 170,
  },
  '4x': {
    span: 158,
    catchAngle: -60,
    finishAngle: 35,
    oarLength: 284,
    inboard: 88,
    pitch: 4,
    gateHeight: 160,
  },
  '2x': {
    span: 160,
    catchAngle: -60,
    finishAngle: 35,
    oarLength: 287,
    inboard: 88,
    pitch: 4,
    gateHeight: 160,
  },
  '2-': {
    spread: 86,
    catchAngle: -58,
    finishAngle: 33,
    oarLength: 372,
    inboard: 114,
    pitch: 4,
    gateHeight: 170,
  },
  '1x': {
    span: 160,
    catchAngle: -60,
    finishAngle: 35,
    oarLength: 289,
    inboard: 88,
    pitch: 4,
    gateHeight: 160,
  },
};

/**
 * Check if boat class uses sculling (span) vs sweep (spread)
 */
export function isScullBoat(boatClass: string): boolean {
  return boatClass.includes('x') || boatClass === '1x';
}
