/**
 * Erg Test and Concept2 types matching backend API
 */

// Reuse common types
import type { SidePreference } from './athletes';
import type { ApiResponse } from './dashboard';

// Test types
export type TestType = '2k' | '6k' | '30min' | '500m';

/**
 * Core erg test record
 */
export interface ErgTest {
  id: string;
  athleteId: string;
  athlete: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    side: SidePreference;
  } | null;
  testType: TestType;
  testDate: string; // ISO date string
  distanceM: number | null;
  timeSeconds: number;
  splitSeconds: number | null; // Per 500m pace in seconds
  watts: number | null;
  strokeRate: number | null;
  weightKg: number | null;
  notes: string | null;
  createdAt: string;
  source?: 'manual' | 'concept2';
  machineType?: 'rower' | 'bikerg' | 'skierg' | null;
  c2LogbookId?: string | null;
}

/**
 * Filters for erg test queries
 */
export interface ErgTestFilters {
  athleteId?: string;
  testType?: TestType | 'all';
  fromDate?: string; // ISO date
  toDate?: string; // ISO date
  source?: 'all' | 'manual' | 'concept2';
  machineType?: 'all' | 'rower' | 'bikerg' | 'skierg';
}

/**
 * Personal bests by test type
 */
export interface PersonalBest {
  timeSeconds: number;
  splitSeconds: number | null;
  watts: number | null;
  date: string; // ISO date
}

export type PersonalBests = Partial<Record<TestType, PersonalBest>>;

/**
 * Athlete erg history response
 */
export interface AthleteErgHistory {
  tests: ErgTest[];
  personalBests: PersonalBests;
  totalTests: number;
}

/**
 * Leaderboard entry with rank
 */
export interface ErgLeaderboardEntry extends ErgTest {
  rank: number;
}

/**
 * Input for creating a new erg test
 */
export interface CreateErgTestInput {
  athleteId: string;
  testType: TestType;
  testDate: string; // ISO date
  timeSeconds: number;
  distanceM?: number | null;
  splitSeconds?: number | null;
  watts?: number | null;
  strokeRate?: number | null;
  weightKg?: number | null;
  notes?: string | null;
}

/**
 * Input for updating an erg test
 */
export interface UpdateErgTestInput {
  testType?: TestType;
  testDate?: string;
  timeSeconds?: number;
  distanceM?: number | null;
  splitSeconds?: number | null;
  watts?: number | null;
  strokeRate?: number | null;
  weightKg?: number | null;
  notes?: string | null;
}

/**
 * Bulk import result
 */
export interface BulkImportResult {
  created: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

/**
 * Machine type display names
 */
export const MACHINE_TYPE_LABELS: Record<string, string> = {
  rower: 'RowErg',
  bikerg: 'BikeErg',
  skierg: 'SkiErg',
};

/**
 * Concept2 connection status
 */
export interface C2Status {
  connected: boolean;
  c2UserId?: string;
  username?: string;
  lastSyncedAt?: string | null;
  syncEnabled?: boolean;
}

/**
 * Concept2 sync operation result
 */
export interface C2SyncResult {
  totalFetched: number;
  ergTestsCreated?: number;
  ergTests?: Array<{
    testType: string;
    date: string;
    distance: number;
  }>;
}

// Re-export common types for convenience
export type { ApiResponse, SidePreference };
