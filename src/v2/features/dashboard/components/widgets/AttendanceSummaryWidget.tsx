import { Link } from 'react-router-dom';
import { Users, CheckCircle, XCircle } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../../contexts/AuthContext';

interface AttendanceSummary {
  totalAthletes: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
}

export function AttendanceSummaryWidget(_props: import('../../types').WidgetProps) {
  const accessToken = useAuth().accessToken;
  const activeTeamId = useAuth().activeTeamId;

  const { data, isLoading } = useQuery({
    queryKey: ['attendance-summary', activeTeamId],
    queryFn: async (): Promise<AttendanceSummary> => {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/v1/attendance/summary?date=${today}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Team-ID': activeTeamId || '',
        },
      });

      if (!response.ok) {
        // Return default if no data
        return {
          totalAthletes: 0,
          presentToday: 0,
          absentToday: 0,
          attendanceRate: 0,
        };
      }

      return response.json();
    },
    enabled: !!accessToken && !!activeTeamId,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-txt-primary flex items-center gap-2">
          <Users className="w-5 h-5 text-accent-primary" />
          Today's Attendance
        </h3>
        <Link to="/app/athletes" className="text-sm text-accent-primary hover:underline">
          View roster
        </Link>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-2 gap-4">
          {/* Present */}
          <div className="bg-green-500/10 rounded-lg p-4 flex flex-col items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
            <div className="text-2xl font-bold text-green-500">{data?.presentToday || 0}</div>
            <div className="text-xs text-txt-muted">Present</div>
          </div>

          {/* Absent */}
          <div className="bg-red-500/10 rounded-lg p-4 flex flex-col items-center justify-center">
            <XCircle className="w-8 h-8 text-red-500 mb-2" />
            <div className="text-2xl font-bold text-red-500">{data?.absentToday || 0}</div>
            <div className="text-xs text-txt-muted">Absent</div>
          </div>

          {/* Rate */}
          <div className="col-span-2 bg-surface-default rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-txt-muted">Attendance Rate</div>
              <div className="text-xl font-bold text-txt-primary">
                {data?.attendanceRate ? `${Math.round(data.attendanceRate)}%` : 'N/A'}
              </div>
            </div>
            <div className="w-20 h-20 relative">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-surface-hover"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${(data?.attendanceRate || 0) * 1.005} 100`}
                  className="text-accent-primary"
                />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
