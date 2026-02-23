/**
 * AttendancePage - Daily attendance tracking + summary view.
 *
 * Daily tab: date navigation, stats console, mark-all-present, athlete roster
 *   with P/L/E/U quick-mark buttons. Athletes sorted unmarked-first.
 * Summary tab: date range picker with presets, aggregate table per athlete.
 *
 * Fully controlled via props: teamId for data scoping, readOnly to hide mutations.
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Calendar,
  Users,
  ClipboardList,
} from 'lucide-react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { formatLongDate } from '@/lib/format';
import { teamRosterOptions } from '@/features/team/api';
import type { RosterMember } from '@/features/team/types';
import {
  attendanceOptions,
  attendanceSummaryOptions,
  useRecordAttendance,
  useBulkRecord,
} from '../api';
import type { AttendanceStatus, AttendanceRecord, AttendanceSummaryRow } from '../types';
import { STATUS_CONFIG, ALL_STATUSES } from '../types';
import { AttendanceSkeleton } from './AttendanceSkeleton';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AttendancePageProps {
  teamId: string;
  readOnly: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Tab = 'daily' | 'summary';

function todayISO(): string {
  return new Date().toISOString().split('T')[0]!;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  }
  return (name[0] ?? '?').toUpperCase();
}

// ---------------------------------------------------------------------------
// AttendancePage
// ---------------------------------------------------------------------------

export function AttendancePage({ teamId, readOnly }: AttendancePageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('daily');
  const [selectedDate, setSelectedDate] = useState(todayISO);

  return (
    <div className="mx-auto max-w-5xl p-4 pb-24 md:p-6">
      {/* Page header */}
      <div className="mb-6">
        <SectionHeader
          title="Attendance"
          description="Track daily practice attendance"
          icon={<ClipboardList className="h-4 w-4" />}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-void-deep/50 p-1 mb-6">
        {(['daily', 'summary'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-void-raised text-text-bright shadow-sm'
                : 'text-text-dim hover:text-text-bright'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              {tab === 'daily' ? (
                <Calendar className="h-4 w-4" />
              ) : (
                <ClipboardList className="h-4 w-4" />
              )}
              {tab === 'daily' ? 'Daily' : 'Summary'}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'daily' ? (
        <DailyTab
          teamId={teamId}
          date={selectedDate}
          setDate={setSelectedDate}
          readOnly={readOnly}
        />
      ) : (
        <SummaryTab teamId={teamId} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Daily tab
// ---------------------------------------------------------------------------

interface DailyTabProps {
  teamId: string;
  date: string;
  setDate: (d: string) => void;
  readOnly: boolean;
}

function DailyTab({ teamId, date, setDate, readOnly }: DailyTabProps) {
  // Roster (suspense)
  const { data: roster } = useSuspenseQuery(teamRosterOptions(teamId));
  const athletes = useMemo(() => roster.filter((m) => m.role === 'ATHLETE'), [roster]);

  // Attendance for selected date
  const { data: records = [], isLoading } = useQuery(attendanceOptions(teamId, date));

  // Build map: athleteId -> record
  const attendanceMap = useMemo(() => {
    const map: Record<string, AttendanceRecord> = {};
    for (const r of records) {
      map[r.athleteId] = r;
    }
    return map;
  }, [records]);

  // Mutations
  const recordMutation = useRecordAttendance(teamId, date);
  const bulkMutation = useBulkRecord(teamId);

  // Sort: unmarked first, then by status order, then alphabetical
  const sorted = useMemo(() => {
    return [...athletes].sort((a, b) => {
      const aStatus = attendanceMap[a.userId]?.status;
      const bStatus = attendanceMap[b.userId]?.status;

      if (!aStatus && bStatus) return -1;
      if (aStatus && !bStatus) return 1;
      if (!aStatus && !bStatus) return a.name.localeCompare(b.name);

      const aOrder = STATUS_CONFIG[aStatus!]?.sortOrder ?? 99;
      const bOrder = STATUS_CONFIG[bStatus!]?.sortOrder ?? 99;
      if (aOrder !== bOrder) return aOrder - bOrder;

      return a.name.localeCompare(b.name);
    });
  }, [athletes, attendanceMap]);

  // Stats
  const stats = useMemo(() => {
    const counts = { present: 0, late: 0, excused: 0, unexcused: 0, unmarked: 0 };
    for (const athlete of athletes) {
      const s = attendanceMap[athlete.userId]?.status;
      if (s && s in counts) {
        counts[s]++;
      } else {
        counts.unmarked++;
      }
    }
    return counts;
  }, [athletes, attendanceMap]);

  const unmarkedCount = sorted.filter((a) => !attendanceMap[a.userId]?.status).length;

  // Date navigation
  const navigateDate = useCallback(
    (dir: 'prev' | 'next') => {
      const d = new Date(date + 'T00:00:00');
      d.setDate(d.getDate() + (dir === 'next' ? 1 : -1));
      const next = d.toISOString().split('T')[0];
      if (next) setDate(next);
    },
    [date, setDate]
  );

  const handleMarkAllPresent = useCallback(() => {
    const recs = athletes.map((a) => ({
      athleteId: a.userId,
      status: 'present' as AttendanceStatus,
    }));
    bulkMutation.mutate({ date, records: recs });
  }, [athletes, bulkMutation, date]);

  const handleMark = useCallback(
    (athleteId: string, status: AttendanceStatus) => {
      recordMutation.mutate({ athleteId, date, status });
    },
    [recordMutation, date]
  );

  if (isLoading) {
    return <AttendanceSkeleton rows={athletes.length || 6} />;
  }

  return (
    <div className="space-y-4">
      {/* Date navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDate('prev')}
            className="rounded-lg bg-void-raised p-2 text-text-dim transition-colors hover:bg-void-deep hover:text-text-bright"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-edge-default bg-void-raised px-3 py-2 font-mono text-sm text-text-bright transition-colors focus:border-accent-teal/50 focus:outline-none"
          />

          <button
            onClick={() => navigateDate('next')}
            className="rounded-lg bg-void-raised p-2 text-text-dim transition-colors hover:bg-void-deep hover:text-text-bright"
            aria-label="Next day"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <span className="text-sm text-accent-sand">{formatLongDate(date)}</span>
      </div>

      {/* Stats console + bulk action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          {(
            [
              { key: 'present', label: 'Present', color: 'text-data-excellent' },
              { key: 'late', label: 'Late', color: 'text-data-warning' },
              { key: 'excused', label: 'Excused', color: 'text-accent-teal-primary' },
              { key: 'unexcused', label: 'Unexcused', color: 'text-data-poor' },
              ...(stats.unmarked > 0
                ? [{ key: 'unmarked', label: 'Unmarked', color: 'text-text-faint' }]
                : []),
            ] as const
          ).map(({ key, label, color }) => (
            <span key={key} className="flex items-center gap-1.5 font-mono text-xs">
              <span className="uppercase tracking-wider text-text-faint">{label}</span>
              <span className={`font-semibold ${color}`}>{stats[key as keyof typeof stats]}</span>
            </span>
          ))}
        </div>

        {!readOnly && (
          <button
            onClick={handleMarkAllPresent}
            disabled={bulkMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-data-excellent/20 px-4 py-2 text-sm font-medium text-data-excellent transition-colors hover:bg-data-excellent/30 disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            Mark All Present
          </button>
        )}
      </div>

      {/* Roster */}
      {athletes.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-text-faint/50" />
          <p className="text-sm font-medium text-text-faint">No athletes in roster</p>
          <p className="mt-1 text-xs text-text-faint/70">
            Invite athletes to your team to track attendance
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {sorted.map((athlete, index) => {
            const currentStatus = attendanceMap[athlete.userId]?.status;
            const isFirstMarked =
              index === unmarkedCount && unmarkedCount > 0 && unmarkedCount < athletes.length;

            return (
              <div key={athlete.userId}>
                {isFirstMarked && (
                  <div className="flex items-center gap-3 py-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent-teal/20 to-accent-teal/20" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-teal">
                      MARKED
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-accent-teal/20 to-accent-teal/20" />
                  </div>
                )}

                <AthleteRow
                  athlete={athlete}
                  status={currentStatus ?? null}
                  readOnly={readOnly}
                  onMark={handleMark}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Athlete row
// ---------------------------------------------------------------------------

interface AthleteRowProps {
  athlete: RosterMember;
  status: AttendanceStatus | null;
  readOnly: boolean;
  onMark: (athleteId: string, status: AttendanceStatus) => void;
}

function AthleteRow({ athlete, status, readOnly, onMark }: AthleteRowProps) {
  return (
    <div
      className={`flex items-center gap-4 rounded-lg p-3 transition-colors ${
        status
          ? 'bg-void-raised/60 border border-edge-default/50'
          : 'bg-void-raised border border-accent-teal/20'
      }`}
    >
      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-void-deep text-xs font-semibold text-text-dim">
        {getInitials(athlete.name)}
      </div>

      {/* Name */}
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-text-bright">{athlete.name}</span>
        {status && (
          <span className={`text-xs ${STATUS_CONFIG[status].color}`}>
            {STATUS_CONFIG[status].label}
          </span>
        )}
      </div>

      {/* Quick-mark buttons */}
      {!readOnly && (
        <div className="flex shrink-0 gap-1.5">
          {ALL_STATUSES.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const isActive = status === s;
            return (
              <button
                key={s}
                onClick={() => onMark(athlete.userId, s)}
                title={cfg.label}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold transition-all ${
                  isActive
                    ? `${cfg.bgColor} ${cfg.color} ring-1 ring-current/30`
                    : 'bg-void-deep/50 text-text-faint hover:bg-void-deep hover:text-text-bright'
                }`}
              >
                {cfg.shortLabel}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary tab
// ---------------------------------------------------------------------------

interface SummaryTabProps {
  teamId: string;
}

function SummaryTab({ teamId }: SummaryTabProps) {
  const [range, setRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      start: start.toISOString().split('T')[0]!,
      end: end.toISOString().split('T')[0]!,
    };
  });

  const { data: summary = [], isLoading } = useQuery(
    attendanceSummaryOptions(teamId, range.start, range.end)
  );

  const applyPreset = useCallback((days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setRange({
      start: start.toISOString().split('T')[0]!,
      end: end.toISOString().split('T')[0]!,
    });
  }, []);

  return (
    <div className="space-y-5">
      {/* Date range picker */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-text-faint">
            From
          </label>
          <input
            type="date"
            value={range.start}
            onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))}
            className="rounded-lg border border-edge-default bg-void-raised px-3 py-2 font-mono text-sm text-text-bright transition-colors focus:border-accent-teal/50 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-text-faint">
            To
          </label>
          <input
            type="date"
            value={range.end}
            onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))}
            className="rounded-lg border border-edge-default bg-void-raised px-3 py-2 font-mono text-sm text-text-bright transition-colors focus:border-accent-teal/50 focus:outline-none"
          />
        </div>

        <div className="flex gap-1.5">
          {[
            { label: '7D', days: 7 },
            { label: '30D', days: 30 },
            { label: '90D', days: 90 },
          ].map(({ label, days }) => (
            <button
              key={label}
              onClick={() => applyPreset(days)}
              className="rounded-lg bg-void-raised px-3 py-2 text-xs font-medium text-text-dim transition-colors hover:bg-void-deep hover:text-text-bright"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary table */}
      {isLoading ? (
        <AttendanceSkeleton rows={4} />
      ) : summary.length === 0 ? (
        <div className="py-12 text-center">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-text-faint/50" />
          <p className="text-sm font-medium text-text-faint">No attendance data for this period</p>
        </div>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edge-default">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-faint">
                    Athlete
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-data-excellent/70">
                    P
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-data-warning/70">
                    L
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-accent-teal-primary/70">
                    E
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-data-poor/70">
                    U
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-faint">
                    Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge-default/50">
                {summary.map((row) => (
                  <SummaryRow key={row.athlete.id} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary row
// ---------------------------------------------------------------------------

function SummaryRow({ row }: { row: AttendanceSummaryRow }) {
  const name = `${row.athlete.firstName} ${row.athlete.lastName}`;
  const rate = Math.round(row.attendanceRate * 100);

  return (
    <tr className="transition-colors hover:bg-void-deep/30">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-void-deep text-xs font-semibold text-text-dim">
            {getInitials(name)}
          </div>
          <span className="font-medium text-text-bright">{name}</span>
        </div>
      </td>
      <td className="px-3 py-3 text-center font-mono text-data-excellent">{row.present}</td>
      <td className="px-3 py-3 text-center font-mono text-data-warning">{row.late}</td>
      <td className="px-3 py-3 text-center font-mono text-accent-teal-primary">{row.excused}</td>
      <td className="px-3 py-3 text-center font-mono text-data-poor">{row.unexcused}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <div className="hidden sm:block h-1.5 w-16 rounded-full bg-void-deep overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                rate >= 90 ? 'bg-data-excellent' : rate >= 75 ? 'bg-data-warning' : 'bg-data-poor'
              }`}
              style={{ width: `${rate}%` }}
            />
          </div>
          <span
            className={`font-mono font-semibold ${
              rate >= 90
                ? 'text-data-excellent'
                : rate >= 75
                  ? 'text-data-warning'
                  : 'text-data-poor'
            }`}
          >
            {rate}%
          </span>
        </div>
      </td>
    </tr>
  );
}

export default AttendancePage;
