import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { queryKeys } from '../lib/queryKeys';
import type {
  Attendance,
  AttendanceRecord,
  AttendanceSummary,
  AttendanceStatus,
  ApiResponse,
} from '../types/athletes';

/**
 * Fetch attendance for a specific date
 */
async function fetchAttendanceByDate(date: string): Promise<Attendance[]> {
  const response = await api.get<ApiResponse<{ attendance: Attendance[] }>>(
    `/api/v1/attendance?date=${date}`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch attendance');
  }

  return response.data.data.attendance;
}

/**
 * Fetch attendance history for a specific athlete
 */
async function fetchAthleteAttendance(
  athleteId: string,
  startDate?: string,
  endDate?: string
): Promise<Attendance[]> {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const response = await api.get<ApiResponse<{ attendance: Attendance[] }>>(
    `/api/v1/attendance/athlete/${athleteId}?${params.toString()}`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch athlete attendance');
  }

  return response.data.data.attendance;
}

/**
 * Fetch team attendance summary
 */
async function fetchAttendanceSummary(
  startDate: string,
  endDate: string
): Promise<AttendanceSummary[]> {
  const response = await api.get<ApiResponse<{ summary: AttendanceSummary[] }>>(
    `/api/v1/attendance/summary?startDate=${startDate}&endDate=${endDate}`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch attendance summary');
  }

  return response.data.data.summary;
}

/**
 * Record attendance for a single athlete
 */
async function recordAttendance(data: {
  athleteId: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
}): Promise<Attendance> {
  const response = await api.post<ApiResponse<Attendance>>('/api/v1/attendance', data);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to record attendance');
  }

  return response.data.data;
}

/**
 * Bulk record attendance
 */
async function bulkRecordAttendance(data: {
  date: string;
  records: AttendanceRecord[];
}): Promise<{ count: number }> {
  const response = await api.post<ApiResponse<{ count: number }>>('/api/v1/attendance/bulk', data);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to bulk record attendance');
  }

  return response.data.data;
}

/**
 * Hook for attendance on a specific date
 */
export function useAttendance(date: string) {
  const queryClient = useQueryClient();
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.attendance.date(date),
    queryFn: () => fetchAttendanceByDate(date),
    enabled: isInitialized && isAuthenticated && !!date,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Convert array to map for easy lookup
  const attendanceMap = (query.data || []).reduce(
    (acc, record) => {
      acc[record.athleteId] = record;
      return acc;
    },
    {} as Record<string, Attendance>
  );

  const recordMutation = useMutation({
    mutationFn: recordAttendance,
    onMutate: async (newRecord) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.attendance.all });
      const previous = queryClient.getQueryData<Attendance[]>(queryKeys.attendance.date(date));

      // Optimistic update
      queryClient.setQueryData<Attendance[]>(queryKeys.attendance.date(date), (old = []) => {
        const existing = old.find((a) => a.athleteId === newRecord.athleteId);
        if (existing) {
          return old.map((a) =>
            a.athleteId === newRecord.athleteId
              ? { ...a, status: newRecord.status, notes: newRecord.notes || null }
              : a
          );
        }
        return [
          ...old,
          {
            id: 'temp-' + Date.now(),
            teamId: 'temp',
            athleteId: newRecord.athleteId,
            date: newRecord.date,
            status: newRecord.status,
            notes: newRecord.notes || null,
            recordedBy: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
      });

      return { previous };
    },
    onError: (_err, _newRecord, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.attendance.date(date), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: bulkRecordAttendance,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
    },
  });

  return {
    attendance: query.data || [],
    attendanceMap,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,

    // Single record
    recordAttendance: recordMutation.mutate,
    isRecording: recordMutation.isPending,
    recordError: recordMutation.error,

    // Bulk record
    bulkRecord: bulkMutation.mutate,
    isBulkRecording: bulkMutation.isPending,
    bulkRecordError: bulkMutation.error,
  };
}

/**
 * Hook for athlete attendance history
 */
export function useAthleteAttendance(
  athleteId: string | null,
  options?: { startDate?: string; endDate?: string }
) {
  const { isAuthenticated, isInitialized } = useAuth();

  return useQuery({
    queryKey: queryKeys.attendance.athlete(athleteId || ''),
    queryFn: () => fetchAthleteAttendance(athleteId!, options?.startDate, options?.endDate),
    enabled: isInitialized && isAuthenticated && !!athleteId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for team attendance summary
 */
export function useAttendanceSummary(startDate: string, endDate: string) {
  const { isAuthenticated, isInitialized } = useAuth();

  return useQuery({
    queryKey: queryKeys.attendance.summary({ startDate, endDate }),
    queryFn: () => fetchAttendanceSummary(startDate, endDate),
    enabled: isInitialized && isAuthenticated && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================
// Streak Calculation
// ============================================

/**
 * Calculate consecutive attendance streak from records.
 * A "present" day is one where status is 'present' or 'late'
 * (late arrivals count toward attendance per Phase 06-06 decision).
 *
 * Records should be sorted descending by date (most recent first).
 */
export function calculateStreak(records: Attendance[]): number {
  if (!records.length) return 0;

  // Sort descending by date
  const sorted = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sorted.length; i++) {
    const record = sorted[i];
    if (!record) break;

    // Count present + late as attending (Phase 06-06)
    if (record.status === 'present' || record.status === 'late') {
      streak++;
    } else {
      break; // Streak broken
    }
  }

  return streak;
}

/**
 * Compute per-athlete streaks from summary data.
 * Returns a map of athleteId -> streak count.
 *
 * Uses client-side calculation from attendance history within a 90-day window.
 */
export function useAttendanceStreaks() {
  const { isAuthenticated, isInitialized } = useAuth();

  // Fetch last 90 days of attendance for streak calculation
  const endDate = new Date().toISOString().split('T')[0] || '';
  const start = new Date();
  start.setDate(start.getDate() - 90);
  const startDate = start.toISOString().split('T')[0] || '';

  const summaryQuery = useQuery({
    queryKey: queryKeys.attendance.summary({ startDate, endDate, type: 'streaks' }),
    queryFn: () => fetchAttendanceSummary(startDate, endDate),
    enabled: isInitialized && isAuthenticated && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
  });

  // Compute streaks from summary data
  // Summary gives us present/late/excused/unexcused counts per athlete
  // For a simple streak approximation, use present + late as consecutive days
  const streakMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (!summaryQuery.data) return map;

    for (const entry of summaryQuery.data) {
      // Approximate streak: present + late days (maximum possible consecutive)
      // This is an upper-bound estimate since we don't have day-by-day ordering from summary
      const attendedDays = entry.present + entry.late;
      map[entry.athlete.id] = attendedDays;
    }

    return map;
  }, [summaryQuery.data]);

  return {
    streakMap,
    isLoading: summaryQuery.isLoading,
  };
}

// ============================================
// Live Polling Variant (for active sessions)
// ============================================

/**
 * Attendance hook with configurable polling for live session use.
 * When isActive is true, polls every 5 seconds. Otherwise, standard staleTime.
 */
export function useLiveAttendance(date: string, isActive: boolean) {
  const queryClient = useQueryClient();
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.attendance.date(date),
    queryFn: () => fetchAttendanceByDate(date),
    enabled: isInitialized && isAuthenticated && !!date,
    staleTime: isActive ? 0 : 1 * 60 * 1000,
    refetchInterval: isActive ? 5000 : false,
  });

  // Convert array to map for easy lookup
  const attendanceMap = (query.data || []).reduce(
    (acc, record) => {
      acc[record.athleteId] = record;
      return acc;
    },
    {} as Record<string, Attendance>
  );

  // Status counts
  const counts = useMemo(() => {
    const result = { present: 0, late: 0, excused: 0, unexcused: 0 };
    for (const record of query.data || []) {
      if (record.status in result) {
        result[record.status]++;
      }
    }
    return result;
  }, [query.data]);

  return {
    attendance: query.data || [],
    attendanceMap,
    counts,
    totalMarked: (query.data || []).length,
    isLoading: query.isLoading,
    dataUpdatedAt: query.dataUpdatedAt,
    refetch: query.refetch,
  };
}
