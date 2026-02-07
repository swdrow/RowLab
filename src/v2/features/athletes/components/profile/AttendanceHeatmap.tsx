import { useMemo, useState } from 'react';
import type { AttendanceStatus } from '@v2/types/athletes';

// ─── Color Mapping ─────────────────────────────────────────────────
const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: 'bg-green-600',
  late: 'bg-amber-500',
  excused: 'bg-blue-500',
  unexcused: 'bg-red-500',
};

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Present',
  late: 'Late',
  excused: 'Excused',
  unexcused: 'Unexcused',
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LABELS_DISPLAY = [0, 2, 4]; // Show M, W, F labels

// ─── Types ─────────────────────────────────────────────────────────
interface HeatmapCell {
  date: string;
  dayOfWeek: number; // 0 = Mon, 6 = Sun
  status: AttendanceStatus | null;
  weekIndex: number;
}

export interface AttendanceHeatmapProps {
  attendanceData: Array<{ date: string; status: AttendanceStatus }>;
  streak: number;
}

// ─── Tooltip Component ─────────────────────────────────────────────
interface HeatmapTooltipProps {
  cell: HeatmapCell;
  x: number;
  y: number;
}

function HeatmapTooltip({ cell, x, y }: HeatmapTooltipProps) {
  const dateObj = new Date(cell.date + 'T00:00:00');
  const formatted = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className="fixed z-50 bg-bg-elevated border border-bdr-default rounded-md px-2.5 py-1.5 shadow-lg pointer-events-none"
      style={{ left: x, top: y - 40 }}
    >
      <span className="text-xs text-txt-primary font-medium block">{formatted}</span>
      <span className="text-[10px] text-txt-tertiary capitalize">
        {cell.status ? STATUS_LABELS[cell.status] : 'No data'}
      </span>
    </div>
  );
}

// ─── AttendanceHeatmap Component ───────────────────────────────────
export function AttendanceHeatmap({ attendanceData, streak }: AttendanceHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    cell: HeatmapCell;
    x: number;
    y: number;
  } | null>(null);

  const grid = useMemo(() => {
    // Build lookup map from attendance data
    const lookup = new Map<string, AttendanceStatus>();
    for (const record of attendanceData) {
      lookup.set(record.date, record.status);
    }

    // Build 12-week grid ending at today
    const today = new Date();
    const cells: HeatmapCell[] = [];
    const numWeeks = 12;

    // Find the start of the grid: go back 12 weeks from this week's Monday
    const currentDay = today.getDay(); // 0=Sun, 1=Mon...
    const mondayOffset = currentDay === 0 ? 6 : currentDay - 1;
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - mondayOffset);
    const startDate = new Date(thisMonday);
    startDate.setDate(thisMonday.getDate() - (numWeeks - 1) * 7);

    for (let week = 0; week < numWeeks; week++) {
      for (let day = 0; day < 7; day++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + week * 7 + day);

        // Skip future dates
        if (cellDate > today) continue;

        const dateStr = cellDate.toISOString().slice(0, 10);
        cells.push({
          date: dateStr,
          dayOfWeek: day,
          status: lookup.get(dateStr) ?? null,
          weekIndex: week,
        });
      }
    }

    return { cells, numWeeks };
  }, [attendanceData]);

  // Empty state
  if (attendanceData.length === 0) {
    return (
      <div className="space-y-1.5">
        <h4 className="text-xs font-medium text-txt-secondary uppercase tracking-wider">
          Attendance
        </h4>
        <div className="h-[120px] flex items-center justify-center border border-dashed border-bdr-subtle rounded-lg">
          <span className="text-xs text-txt-tertiary">No attendance recorded</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header with streak badge */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-txt-secondary uppercase tracking-wider">
          Attendance
        </h4>
        {streak > 0 && (
          <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
            {streak}-day streak
          </span>
        )}
      </div>

      {/* Heatmap Grid */}
      <div className="flex gap-1">
        {/* Day labels column */}
        <div className="flex flex-col gap-[2px] mr-0.5">
          {Array.from({ length: 7 }, (_, dayIndex) => (
            <div key={dayIndex} className="h-3 w-5 flex items-center justify-end pr-0.5">
              {DAY_LABELS_DISPLAY.includes(dayIndex) && (
                <span className="text-[8px] text-txt-tertiary leading-none">
                  {DAY_NAMES[dayIndex]?.charAt(0)}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Week columns */}
        {Array.from({ length: grid.numWeeks }, (_, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-[2px]">
            {Array.from({ length: 7 }, (_, dayIndex) => {
              const cell = grid.cells.find(
                (c) => c.weekIndex === weekIndex && c.dayOfWeek === dayIndex
              );

              if (!cell) {
                return <div key={dayIndex} className="h-3 w-3 rounded-[2px] bg-transparent" />;
              }

              const colorClass = cell.status ? STATUS_COLORS[cell.status] : 'bg-bg-surface';

              return (
                <div
                  key={dayIndex}
                  className={`h-3 w-3 rounded-[2px] ${colorClass} transition-opacity cursor-default ${
                    !cell.status ? 'opacity-30' : 'opacity-100'
                  }`}
                  onMouseEnter={(e) => {
                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                    setHoveredCell({
                      cell,
                      x: rect.left + rect.width / 2,
                      y: rect.top,
                    });
                  }}
                  onMouseLeave={() => setHoveredCell(null)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 pt-1">
        {(Object.entries(STATUS_COLORS) as [AttendanceStatus, string][]).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-[1px] ${color}`} />
            <span className="text-[9px] text-txt-tertiary capitalize">{status}</span>
          </span>
        ))}
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <HeatmapTooltip cell={hoveredCell.cell} x={hoveredCell.x} y={hoveredCell.y} />
      )}
    </div>
  );
}

export default AttendanceHeatmap;
