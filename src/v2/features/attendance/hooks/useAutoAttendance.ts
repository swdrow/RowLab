import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';

// Attendance statuses
export type AttendanceStatus = 'Present' | 'Late' | 'Partial' | 'Absent' | 'Injured' | 'Class';

// Attendance record
export interface SessionAttendanceRecord {
  id: string;
  sessionId: string;
  athleteId: string;
  status: AttendanceStatus;
  participationPercent: number;
  autoRecorded: boolean;
  overriddenAt?: string;
  overriddenById?: string;
  athlete?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// Query keys
export const attendanceKeys = {
  session: (sessionId: string) => ['session-attendance', sessionId] as const,
};

// Fetch session attendance
export function useSessionAttendance(sessionId: string) {
  const { accessToken, teamId } = useAuth();

  return useQuery({
    queryKey: attendanceKeys.session(sessionId),
    queryFn: async (): Promise<SessionAttendanceRecord[]> => {
      const response = await fetch(`/api/v1/sessions/${sessionId}/attendance`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Team-ID': teamId || '',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch attendance');
      return response.json();
    },
    enabled: !!accessToken && !!teamId && !!sessionId,
    staleTime: 5 * 60 * 1000,
  });
}

// Record attendance (called when athlete participates)
export function useRecordAttendance() {
  const queryClient = useQueryClient();
  const { accessToken, teamId } = useAuth();

  return useMutation({
    mutationFn: async ({
      sessionId,
      athleteId,
      participationPercent,
    }: {
      sessionId: string;
      athleteId: string;
      participationPercent: number;
    }) => {
      const response = await fetch(`/api/v1/sessions/${sessionId}/record-attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'X-Team-ID': teamId || '',
        },
        body: JSON.stringify({ athleteId, participationPercent }),
      });

      if (!response.ok) throw new Error('Failed to record attendance');
      return response.json();
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.session(sessionId) });
    },
  });
}

// Override attendance
export function useAttendanceOverride() {
  const queryClient = useQueryClient();
  const { accessToken, teamId } = useAuth();

  return useMutation({
    mutationFn: async ({
      sessionId,
      athleteId,
      status,
    }: {
      sessionId: string;
      athleteId: string;
      status: AttendanceStatus;
    }) => {
      const response = await fetch(`/api/v1/sessions/${sessionId}/attendance/${athleteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'X-Team-ID': teamId || '',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to override attendance');
      return response.json();
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.session(sessionId) });
    },
  });
}

// Check if override is locked (24 hours after first override)
export function isOverrideLocked(record: SessionAttendanceRecord): boolean {
  if (!record.overriddenAt) return false;

  const lockExpiry = new Date(record.overriddenAt);
  lockExpiry.setHours(lockExpiry.getHours() + 24);

  return new Date() >= lockExpiry;
}
