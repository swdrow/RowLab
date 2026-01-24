/**
 * Athletes and Attendance types matching Prisma schema
 */

// Athlete types
export type SidePreference = 'Port' | 'Starboard' | 'Both' | 'Cox' | null;

export interface Athlete {
  id: string;
  teamId: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  side: SidePreference;
  canScull: boolean;
  canCox: boolean;
  isManaged: boolean;
  concept2UserId: string | null;
  weightKg: number | null;
  heightCm: number | null;
  country: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AthleteWithStats extends Athlete {
  // Optional related data
  ergTestCount?: number;
  latestErgTest?: {
    testType: string;
    time: string;
    testDate: string;
  };
  attendanceRate?: number;
}

// Attendance types
export type AttendanceStatus = 'present' | 'late' | 'excused' | 'unexcused';

export interface Attendance {
  id: string;
  teamId: string;
  athleteId: string;
  date: string;
  status: AttendanceStatus;
  notes: string | null;
  recordedBy: string | null;
  createdAt: string;
  updatedAt: string;
  athlete?: {
    id: string;
    firstName: string;
    lastName: string;
    side: SidePreference;
  };
}

export interface AttendanceRecord {
  athleteId: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface AttendanceSummary {
  athlete: {
    id: string;
    firstName: string;
    lastName: string;
  };
  present: number;
  late: number;
  excused: number;
  unexcused: number;
  total: number;
}

// Filter types
export interface AthleteFilters {
  search?: string;
  side?: SidePreference | 'all';
  canScull?: boolean | null;
  canCox?: boolean | null;
}

// CSV Import types
export interface CSVAthleteRow {
  firstName: string;
  lastName: string;
  email?: string;
  side?: string;
  canScull?: boolean | string;
  canCox?: boolean | string;
  weightKg?: number | string;
  heightCm?: number | string;
}

export interface CSVValidationError {
  row: number;
  field: string;
  message: string;
}

export interface CSVImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: CSVValidationError[];
}

// Reuse ApiResponse from dashboard types
export type { ApiResponse } from './dashboard';
