/**
 * Recruiting feature types.
 *
 * Covers recruit visit CRUD, status lifecycle, and filtering.
 * Slimmed from v2 types (dropped schedule editor, calendar event, sharing).
 */

// ---------------------------------------------------------------------------
// Status lifecycle
// ---------------------------------------------------------------------------

export type VisitStatus = 'scheduled' | 'completed' | 'cancelled';

export const VISIT_STATUS_OPTIONS: { value: VisitStatus; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

// ---------------------------------------------------------------------------
// Recruit visit record (from backend)
// ---------------------------------------------------------------------------

export interface RecruitVisit {
  id: string;
  teamId: string;
  recruitName: string;
  recruitEmail?: string | null;
  recruitPhone?: string | null;
  recruitSchool?: string | null;
  recruitGradYear?: number | null;
  date: string; // ISO date string
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  hostAthlete?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  notes?: string | null;
  status: VisitStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// CRUD inputs
// ---------------------------------------------------------------------------

export interface CreateVisitInput {
  recruitName: string;
  recruitEmail?: string;
  recruitPhone?: string;
  recruitSchool?: string;
  recruitGradYear?: number;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface UpdateVisitInput extends Partial<CreateVisitInput> {
  status?: VisitStatus;
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export interface VisitFilters {
  status?: VisitStatus;
}
