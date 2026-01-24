import { useMemo } from 'react';
import { useAttendanceSummary } from '@v2/hooks/useAttendance';
import type { AttendanceStatus } from '@v2/types/athletes';

interface AttendanceSummaryProps {
  startDate: string;
  endDate: string;
  onSelectAthlete?: (athleteId: string) => void;
}

const statusColors: Record<AttendanceStatus, string> = {
  present: 'text-green-400',
  late: 'text-yellow-400',
  excused: 'text-blue-400',
  unexcused: 'text-red-400',
};

export function AttendanceSummary({
  startDate,
  endDate,
  onSelectAthlete,
}: AttendanceSummaryProps) {
  const { data: summary, isLoading } = useAttendanceSummary(startDate, endDate);

  // Sort by attendance rate (descending)
  const sortedSummary = useMemo(() => {
    if (!summary) return [];
    return [...summary].sort((a, b) => {
      const rateA = a.total > 0 ? (a.present + a.late) / a.total : 0;
      const rateB = b.total > 0 ? (b.present + b.late) / b.total : 0;
      return rateB - rateA;
    });
  }, [summary]);

  // Calculate team totals
  const totals = useMemo(() => {
    if (!summary) return null;
    return summary.reduce(
      (acc, row) => ({
        present: acc.present + row.present,
        late: acc.late + row.late,
        excused: acc.excused + row.excused,
        unexcused: acc.unexcused + row.unexcused,
        total: acc.total + row.total,
      }),
      { present: 0, late: 0, excused: 0, unexcused: 0, total: 0 }
    );
  }, [summary]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-interactive-primary" />
      </div>
    );
  }

  if (!summary || summary.length === 0) {
    return (
      <div className="text-center py-12 text-txt-secondary">
        No attendance data for this period.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-xs text-txt-secondary uppercase border-b border-bdr-default">
            <th className="px-4 py-3 text-left">Athlete</th>
            <th className="px-4 py-3 text-center w-20">Present</th>
            <th className="px-4 py-3 text-center w-20">Late</th>
            <th className="px-4 py-3 text-center w-20">Excused</th>
            <th className="px-4 py-3 text-center w-20">Unexcused</th>
            <th className="px-4 py-3 text-center w-24">Rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-bdr-subtle">
          {sortedSummary.map((row) => {
            const rate = row.total > 0
              ? ((row.present + row.late) / row.total * 100).toFixed(0)
              : '—';
            const rateColor = row.total > 0
              ? Number(rate) >= 90 ? 'text-green-400'
                : Number(rate) >= 75 ? 'text-yellow-400'
                : 'text-red-400'
              : 'text-txt-tertiary';

            return (
              <tr
                key={row.athlete.id}
                className={`hover:bg-bg-hover ${onSelectAthlete ? 'cursor-pointer' : ''}`}
                onClick={() => onSelectAthlete?.(row.athlete.id)}
              >
                <td className="px-4 py-3 font-medium text-txt-primary">
                  {row.athlete.lastName}, {row.athlete.firstName}
                </td>
                <td className={`px-4 py-3 text-center ${statusColors.present}`}>
                  {row.present || '—'}
                </td>
                <td className={`px-4 py-3 text-center ${statusColors.late}`}>
                  {row.late || '—'}
                </td>
                <td className={`px-4 py-3 text-center ${statusColors.excused}`}>
                  {row.excused || '—'}
                </td>
                <td className={`px-4 py-3 text-center ${statusColors.unexcused}`}>
                  {row.unexcused || '—'}
                </td>
                <td className={`px-4 py-3 text-center font-medium ${rateColor}`}>
                  {rate === '—' ? rate : `${rate}%`}
                </td>
              </tr>
            );
          })}
        </tbody>

        {/* Totals row */}
        {totals && (
          <tfoot>
            <tr className="bg-bg-surface-elevated font-medium">
              <td className="px-4 py-3 text-txt-primary">Team Total</td>
              <td className={`px-4 py-3 text-center ${statusColors.present}`}>
                {totals.present}
              </td>
              <td className={`px-4 py-3 text-center ${statusColors.late}`}>
                {totals.late}
              </td>
              <td className={`px-4 py-3 text-center ${statusColors.excused}`}>
                {totals.excused}
              </td>
              <td className={`px-4 py-3 text-center ${statusColors.unexcused}`}>
                {totals.unexcused}
              </td>
              <td className="px-4 py-3 text-center text-txt-primary">
                {totals.total > 0
                  ? `${((totals.present + totals.late) / totals.total * 100).toFixed(0)}%`
                  : '—'}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
