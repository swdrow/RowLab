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
