/**
 * Attendance feature types.
 *
 * Status values match backend enum: present, late, excused, unexcused.
 * Date strings are ISO 8601 format (YYYY-MM-DD).
 */

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

export type AttendanceStatus = 'present' | 'late' | 'excused' | 'unexcused';

/** Display config for each status */
export const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; shortLabel: string; color: string; bgColor: string; sortOrder: number }
> = {
  present: {
    label: 'Present',
    shortLabel: 'P',
    color: 'text-data-excellent',
    bgColor: 'bg-data-excellent/20 hover:bg-data-excellent/30',
    sortOrder: 0,
  },
  late: {
    label: 'Late',
    shortLabel: 'L',
    color: 'text-data-warning',
    bgColor: 'bg-data-warning/20 hover:bg-data-warning/30',
    sortOrder: 1,
  },
  excused: {
    label: 'Excused',
    shortLabel: 'E',
    color: 'text-accent-teal-primary',
    bgColor: 'bg-accent-teal-primary/20 hover:bg-accent-teal-primary/30',
    sortOrder: 2,
  },
  unexcused: {
    label: 'Unexcused',
    shortLabel: 'U',
    color: 'text-data-poor',
    bgColor: 'bg-data-poor/20 hover:bg-data-poor/30',
    sortOrder: 3,
  },
};

export const ALL_STATUSES: AttendanceStatus[] = ['present', 'late', 'excused', 'unexcused'];

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

export interface AttendanceRecord {
  id: string;
  teamId: string;
  athleteId: string;
  date: string;
  status: AttendanceStatus;
  notes: string | null;
  recordedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Map of athleteId -> AttendanceRecord for quick lookup */
export type AttendanceMap = Record<string, AttendanceRecord>;

// ---------------------------------------------------------------------------
// Mutation inputs
// ---------------------------------------------------------------------------

export interface RecordAttendanceInput {
  athleteId: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface BulkRecordInput {
  date: string;
  records: Array<{
    athleteId: string;
    status: AttendanceStatus;
    notes?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

export interface AttendanceSummaryRow {
  athlete: {
    id: string;
    firstName: string;
    lastName: string;
    side?: string | null;
  };
  present: number;
  late: number;
  excused: number;
  unexcused: number;
  totalDays: number;
  attendanceRate: number;
}
