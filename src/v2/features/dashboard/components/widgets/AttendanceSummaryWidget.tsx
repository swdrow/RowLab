import { Link } from 'react-router-dom';
import { Users, CheckCircle, XCircle } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { useAttendanceSummary } from '../../../../hooks/useAttendance';

export function AttendanceSummaryWidget(_props: import('../../types').WidgetProps) {
  const today = new Date().toISOString().split('T')[0] || '';
  const { data, isLoading } = useAttendanceSummary(today, today);

  // Aggregate per-athlete summary data into totals
  const aggregated = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalAthletes: 0,
        presentToday: 0,
        absentToday: 0,
        attendanceRate: 0,
      };
    }

    const totalAthletes = data.length;
    let presentToday = 0;
    let absentToday = 0;

    for (const athlete of data) {
      // Count present + late as "present today"
      if (athlete.present > 0 || athlete.late > 0) {
        presentToday++;
      } else {
        absentToday++;
      }
    }

    const attendanceRate = totalAthletes > 0 ? (presentToday / totalAthletes) * 100 : 0;

    return {
      totalAthletes,
      presentToday,
      absentToday,
      attendanceRate,
    };
  }, [data]);

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
            <div className="text-2xl font-bold text-green-500">{aggregated.presentToday}</div>
            <div className="text-xs text-txt-muted">Present</div>
          </div>

          {/* Absent */}
          <div className="bg-red-500/10 rounded-lg p-4 flex flex-col items-center justify-center">
            <XCircle className="w-8 h-8 text-red-500 mb-2" />
            <div className="text-2xl font-bold text-red-500">{aggregated.absentToday}</div>
            <div className="text-xs text-txt-muted">Absent</div>
          </div>

          {/* Rate */}
          <div className="col-span-2 bg-surface-default rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-txt-muted">Attendance Rate</div>
              <div className="text-xl font-bold text-txt-primary">
                {aggregated.attendanceRate > 0
                  ? `${Math.round(aggregated.attendanceRate)}%`
                  : 'N/A'}
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
                  strokeDasharray={`${aggregated.attendanceRate * 1.005} 100`}
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
