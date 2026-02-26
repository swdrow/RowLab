/**
 * Attendance API functions and query option factories.
 *
 * Uses /api/v1/attendance endpoints (existing backend).
 * Query keys are team-scoped for cache isolation on team switch.
 */
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AttendanceRecord,
  AttendanceSummaryRow,
  RecordAttendanceInput,
  BulkRecordInput,
} from './types';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const attendanceKeys = {
  all: (teamId: string) => ['attendance', teamId] as const,
  date: (teamId: string, date: string) => ['attendance', teamId, 'date', date] as const,
  summary: (teamId: string, start: string, end: string) =>
    ['attendance', teamId, 'summary', start, end] as const,
  athlete: (teamId: string, athleteId: string) =>
    ['attendance', teamId, 'athlete', athleteId] as const,
};

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

async function fetchAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
  const res = await api.get(`/api/v1/attendance?date=${date}`);
  return res.data.data.attendance as AttendanceRecord[];
}

async function fetchAttendanceSummary(
  startDate: string,
  endDate: string
): Promise<AttendanceSummaryRow[]> {
  const res = await api.get(`/api/v1/attendance/summary?startDate=${startDate}&endDate=${endDate}`);
  return res.data.data.summary as AttendanceSummaryRow[];
}

async function recordAttendance(input: RecordAttendanceInput): Promise<AttendanceRecord> {
  const res = await api.post('/api/v1/attendance', input);
  return res.data.data as AttendanceRecord;
}

async function bulkRecordAttendance(input: BulkRecordInput): Promise<{ count: number }> {
  const res = await api.post('/api/v1/attendance/bulk', input);
  return res.data.data as { count: number };
}

// ---------------------------------------------------------------------------
// Query option factories
// ---------------------------------------------------------------------------

export function attendanceOptions(teamId: string, date: string) {
  return queryOptions<AttendanceRecord[]>({
    queryKey: attendanceKeys.date(teamId, date),
    queryFn: () => fetchAttendanceByDate(date),
    staleTime: 60_000,
    enabled: !!teamId && !!date,
  });
}

export function attendanceSummaryOptions(teamId: string, start: string, end: string) {
  return queryOptions<AttendanceSummaryRow[]>({
    queryKey: attendanceKeys.summary(teamId, start, end),
    queryFn: () => fetchAttendanceSummary(start, end),
    staleTime: 300_000,
    enabled: !!teamId && !!start && !!end,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Record attendance for a single athlete with optimistic update.
 */
export function useRecordAttendance(teamId: string, date: string) {
  const queryClient = useQueryClient();
  const dateKey = attendanceKeys.date(teamId, date);

  return useMutation({
    mutationFn: recordAttendance,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: dateKey });
      const previous = queryClient.getQueryData<AttendanceRecord[]>(dateKey);

      queryClient.setQueryData<AttendanceRecord[]>(dateKey, (old = []) => {
        const existing = old.find((r) => r.athleteId === input.athleteId);
        if (existing) {
          return old.map((r) =>
            r.athleteId === input.athleteId
              ? { ...r, status: input.status, notes: input.notes ?? null }
              : r
          );
        }
        return [
          ...old,
          {
            id: `temp-${Date.now()}`,
            teamId,
            athleteId: input.athleteId,
            date: input.date,
            status: input.status,
            notes: input.notes ?? null,
            recordedBy: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
      });

      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(dateKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all(teamId) });
    },
  });
}

/**
 * Bulk-record attendance (e.g. "Mark All Present").
 */
export function useBulkRecord(teamId: string, _date?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkRecordAttendance,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all(teamId) });
    },
  });
}
