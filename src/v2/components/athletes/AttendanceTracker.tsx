import { useCallback, useMemo } from 'react';
import { CheckCircle } from 'lucide-react';
import { useAthletes } from '@v2/hooks/useAthletes';
import { useAttendance } from '@v2/hooks/useAttendance';
import { AthleteAvatar } from './AthleteAvatar';
import type { AttendanceStatus } from '@v2/types/athletes';

interface AttendanceTrackerProps {
  date: string; // ISO date string YYYY-MM-DD
}

const statusOptions: AttendanceStatus[] = ['present', 'late', 'excused', 'unexcused'];

const statusConfig: Record<AttendanceStatus, { label: string; color: string; bgColor: string }> = {
  present: { label: 'P', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  late: { label: 'L', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  excused: { label: 'E', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  unexcused: { label: 'U', color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

export function AttendanceTracker({ date }: AttendanceTrackerProps) {
  const { athletes, isLoading: athletesLoading } = useAthletes();
  const {
    attendanceMap,
    isLoading: attendanceLoading,
    recordAttendance,
    isRecording,
    bulkRecord,
    isBulkRecording,
  } = useAttendance(date);

  const isLoading = athletesLoading || attendanceLoading;

  // Sort athletes by last name
  const sortedAthletes = useMemo(
    () => [...athletes].sort((a, b) => a.lastName.localeCompare(b.lastName)),
    [athletes]
  );

  // Calculate stats
  const stats = useMemo(() => {
    const counts = { present: 0, late: 0, excused: 0, unexcused: 0, unmarked: 0 };
    sortedAthletes.forEach((athlete) => {
      const status = attendanceMap[athlete.id]?.status;
      if (status) {
        counts[status]++;
      } else {
        counts.unmarked++;
      }
    });
    return counts;
  }, [sortedAthletes, attendanceMap]);

  const handleStatusChange = useCallback(
    (athleteId: string, status: AttendanceStatus) => {
      recordAttendance({ athleteId, date, status });
    },
    [recordAttendance, date]
  );

  const handleMarkAllPresent = useCallback(() => {
    const records = sortedAthletes.map((athlete) => ({
      athleteId: athlete.id,
      status: 'present' as AttendanceStatus,
    }));
    bulkRecord({ date, records });
  }, [sortedAthletes, bulkRecord, date]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-interactive-primary" />
      </div>
    );
  }

  if (athletes.length === 0) {
    return (
      <div className="text-center py-12 text-txt-secondary">
        No athletes in roster. Add athletes to track attendance.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with stats and bulk action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {Object.entries(statusConfig).map(([status, config]) => (
            <div key={status} className="flex items-center gap-2">
              <span className={`text-sm font-medium ${config.color}`}>
                {stats[status as AttendanceStatus]}
              </span>
              <span className="text-xs text-txt-tertiary">{status}</span>
            </div>
          ))}
          {stats.unmarked > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-txt-secondary">{stats.unmarked}</span>
              <span className="text-xs text-txt-tertiary">unmarked</span>
            </div>
          )}
        </div>

        <button
          onClick={handleMarkAllPresent}
          disabled={isBulkRecording}
          className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg
                     font-medium hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle size={18} />
          Mark All Present
        </button>
      </div>

      {/* Athlete list */}
      <div className="space-y-2">
        {sortedAthletes.map((athlete) => {
          const currentStatus = attendanceMap[athlete.id]?.status;

          return (
            <div
              key={athlete.id}
              className="flex items-center justify-between p-4 bg-bg-surface-elevated rounded-lg"
            >
              {/* Athlete info */}
              <div className="flex items-center gap-3">
                <AthleteAvatar firstName={athlete.firstName} lastName={athlete.lastName} size="sm" />
                <div>
                  <span className="font-medium text-txt-primary">
                    {athlete.lastName}, {athlete.firstName}
                  </span>
                  {athlete.side && (
                    <span className="ml-2 text-xs text-txt-tertiary">
                      ({athlete.side})
                    </span>
                  )}
                </div>
              </div>

              {/* Status buttons */}
              <div className="flex gap-1">
                {statusOptions.map((status) => {
                  const config = statusConfig[status];
                  const isSelected = currentStatus === status;

                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(athlete.id, status)}
                      disabled={isRecording}
                      className={`
                        w-10 h-10 rounded-lg text-sm font-semibold transition-all
                        ${isSelected
                          ? `${config.bgColor} ${config.color}`
                          : 'bg-bg-surface text-txt-tertiary hover:bg-bg-hover hover:text-txt-secondary'}
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                      title={status.charAt(0).toUpperCase() + status.slice(1)}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
