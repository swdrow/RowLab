import { useState, useMemo, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Calendar, BarChart3, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { AttendanceSummary as AttendanceSummaryView } from '@v2/components/athletes/AttendanceSummary';
import { AttendanceHistory } from '@v2/components/athletes/AttendanceHistory';
import { AthleteAvatar } from '@v2/components/athletes/AthleteAvatar';
import { QuickMarkAttendance } from '@v2/features/attendance/components/QuickMarkAttendance';
import { AttendanceStreakBadge } from '@v2/features/attendance/components/AttendanceStreakBadge';
import { LiveAttendancePanel } from '@v2/features/attendance/components/LiveAttendancePanel';
import { TrainingShortcutsHelp } from '@v2/features/training/components/TrainingShortcutsHelp';
import { useAthletes } from '@v2/hooks/useAthletes';
import { useAttendance, useAttendanceStreaks } from '@v2/hooks/useAttendance';
import { useActiveSession } from '@v2/hooks/useSessions';
import { useTrainingKeyboard, getTrainingShortcuts } from '@v2/hooks/useTrainingKeyboard';
import type { AttendanceStatus } from '@v2/types/athletes';

type Tab = 'daily' | 'summary';

// Status sort order for marked athletes
const STATUS_ORDER: Record<AttendanceStatus, number> = {
  present: 0,
  late: 1,
  excused: 2,
  unexcused: 3,
};

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<Tab>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0] || '';
  });
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      start: start.toISOString().split('T')[0] || '',
      end: end.toISOString().split('T')[0] || '',
    };
  });
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);

  const { athletes } = useAthletes();
  const {
    attendanceMap,
    isLoading: attendanceLoading,
    bulkRecord,
    isBulkRecording,
  } = useAttendance(selectedDate);
  const { streakMap } = useAttendanceStreaks();
  const { session: activeSession } = useActiveSession();
  const hasActiveSession = activeSession?.status === 'ACTIVE';

  // Keyboard shortcuts (no N shortcut on attendance — not applicable)
  const { showHelp, setShowHelp } = useTrainingKeyboard({
    onEscape: useCallback(() => {
      setSelectedAthleteId(null);
    }, []),
  });

  const shortcuts = useMemo(
    () =>
      getTrainingShortcuts({
        hasNewSession: false,
        hasRefresh: true,
        hasEscape: true,
      }),
    []
  );

  // Find selected athlete
  const selectedAthlete = useMemo(() => {
    if (!selectedAthleteId) return null;
    return athletes.find((a) => a.id === selectedAthleteId);
  }, [athletes, selectedAthleteId]);

  // Sort: unmarked first (need attention), then marked by status order
  const sortedAthletes = useMemo(() => {
    return [...athletes].sort((a, b) => {
      const aStatus = attendanceMap[a.id]?.status;
      const bStatus = attendanceMap[b.id]?.status;

      // Unmarked athletes come first
      if (!aStatus && bStatus) return -1;
      if (aStatus && !bStatus) return 1;

      // Both unmarked: sort by last name
      if (!aStatus && !bStatus) {
        return a.lastName.localeCompare(b.lastName);
      }

      // Both marked: sort by status order, then last name
      const aOrder = STATUS_ORDER[aStatus!] ?? 99;
      const bOrder = STATUS_ORDER[bStatus!] ?? 99;
      if (aOrder !== bOrder) return aOrder - bOrder;

      return a.lastName.localeCompare(b.lastName);
    });
  }, [athletes, attendanceMap]);

  // Calculate stats
  const stats = useMemo(() => {
    const counts = { present: 0, late: 0, excused: 0, unexcused: 0, unmarked: 0 };
    athletes.forEach((athlete) => {
      const status = attendanceMap[athlete.id]?.status;
      if (status) {
        counts[status]++;
      } else {
        counts.unmarked++;
      }
    });
    return counts;
  }, [athletes, attendanceMap]);

  // Date navigation
  const navigateDate = (direction: 'prev' | 'next') => {
    const date = new Date(selectedDate + 'T00:00:00');
    date.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
    const newDate = date.toISOString().split('T')[0];
    if (newDate) setSelectedDate(newDate);
  };

  const formattedDate = useMemo(() => {
    return new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDate]);

  const handleMarkAllPresent = () => {
    const records = athletes.map((athlete) => ({
      athleteId: athlete.id,
      status: 'present' as AttendanceStatus,
    }));
    bulkRecord({ date: selectedDate, records });
  };

  // Count for unmarked separator
  const unmarkedCount = sortedAthletes.filter((a) => !attendanceMap[a.id]?.status).length;

  return (
    <div className="h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-bdr-default">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-display font-semibold text-txt-primary">Attendance</h1>
            <p className="text-sm text-txt-secondary mt-1">Track and view team attendance</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-bg-surface-elevated rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'daily'
                ? 'bg-interactive-primary text-white'
                : 'text-txt-secondary hover:text-txt-primary hover:bg-bg-hover'
            }`}
          >
            <Calendar size={18} />
            Daily
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'summary'
                ? 'bg-interactive-primary text-white'
                : 'text-txt-secondary hover:text-txt-primary hover:bg-bg-hover'
            }`}
          >
            <BarChart3 size={18} />
            Summary
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`px-6 py-4 ${hasActiveSession ? 'border-l-2 border-data-excellent/20' : ''}`}>
        {/* Live Attendance Panel — shown during active sessions */}
        <AnimatePresence>
          {hasActiveSession && (
            <div className="mb-4">
              <LiveAttendancePanel date={selectedDate} />
            </div>
          )}
        </AnimatePresence>

        {activeTab === 'daily' ? (
          <div className="space-y-4">
            {/* Date picker */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateDate('prev')}
                  className="p-2 text-txt-secondary hover:text-txt-primary hover:bg-bg-hover rounded-lg"
                >
                  <ChevronLeft size={20} />
                </button>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 bg-bg-surface-elevated border border-bdr-default rounded-lg
                             text-txt-primary focus:outline-none focus:border-interactive-primary"
                />

                <button
                  onClick={() => navigateDate('next')}
                  className="p-2 text-txt-secondary hover:text-txt-primary hover:bg-bg-hover rounded-lg"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <span className="text-txt-secondary">{formattedDate}</span>
            </div>

            {/* Stats bar + bulk action */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-medium text-data-excellent">
                    {stats.present}
                  </span>
                  <span className="text-xs text-txt-tertiary">present</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-medium text-data-good">{stats.late}</span>
                  <span className="text-xs text-txt-tertiary">late</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-medium text-data-warning">
                    {stats.excused}
                  </span>
                  <span className="text-xs text-txt-tertiary">excused</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-medium text-data-poor">
                    {stats.unexcused}
                  </span>
                  <span className="text-xs text-txt-tertiary">unexcused</span>
                </div>
                {stats.unmarked > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-medium text-txt-secondary">
                      {stats.unmarked}
                    </span>
                    <span className="text-xs text-txt-tertiary">unmarked</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleMarkAllPresent}
                disabled={isBulkRecording}
                className="flex items-center gap-2 px-4 py-2 bg-data-excellent/20 text-data-excellent rounded-lg
                           font-medium hover:bg-data-excellent/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle size={18} />
                Mark All Present
              </button>
            </div>

            {/* Athlete roster with one-tap attendance */}
            {attendanceLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-bg-surface-elevated rounded-lg animate-pulse" />
                ))}
              </div>
            ) : athletes.length === 0 ? (
              <div className="text-center py-12 text-txt-secondary">
                No athletes in roster. Add athletes to track attendance.
              </div>
            ) : (
              <div className="space-y-1">
                {sortedAthletes.map((athlete, index) => {
                  const currentStatus = attendanceMap[athlete.id]?.status;
                  const streak = streakMap[athlete.id] ?? 0;

                  // Visual separator between unmarked and marked athletes
                  const isFirstMarked =
                    index === unmarkedCount && unmarkedCount > 0 && unmarkedCount < athletes.length;

                  return (
                    <div key={athlete.id}>
                      {isFirstMarked && (
                        <div className="flex items-center gap-3 py-2">
                          <div className="flex-1 h-px bg-bdr-default" />
                          <span className="text-xs text-txt-tertiary uppercase tracking-wider">
                            Marked
                          </span>
                          <div className="flex-1 h-px bg-bdr-default" />
                        </div>
                      )}

                      <div
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                          currentStatus
                            ? 'bg-bg-surface-elevated'
                            : 'bg-bg-surface-elevated border border-bdr-default'
                        }`}
                      >
                        {/* Left: Avatar + name + streak */}
                        <div className="flex items-center gap-3 min-w-0">
                          <AthleteAvatar
                            firstName={athlete.firstName}
                            lastName={athlete.lastName}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-txt-primary truncate">
                                {athlete.lastName}, {athlete.firstName}
                              </span>
                              {athlete.side && (
                                <span className="text-xs text-txt-tertiary flex-shrink-0">
                                  ({athlete.side})
                                </span>
                              )}
                            </div>
                            {streak > 0 && (
                              <div className="mt-0.5">
                                <AttendanceStreakBadge streak={streak} size="sm" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: P/L/E/U buttons */}
                        <div className="flex-shrink-0 ml-4">
                          <QuickMarkAttendance
                            athleteId={athlete.id}
                            date={selectedDate}
                            currentStatus={currentStatus}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Date range picker */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-txt-secondary">From:</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="px-3 py-2 bg-bg-surface-elevated border border-bdr-default rounded-lg
                             text-txt-primary text-sm focus:outline-none focus:border-interactive-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-txt-secondary">To:</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="px-3 py-2 bg-bg-surface-elevated border border-bdr-default rounded-lg
                             text-txt-primary text-sm focus:outline-none focus:border-interactive-primary"
                />
              </div>

              {/* Quick presets */}
              <div className="flex gap-2">
                {[
                  { label: '7d', days: 7 },
                  { label: '30d', days: 30 },
                  { label: '90d', days: 90 },
                ].map(({ label, days }) => (
                  <button
                    key={label}
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(start.getDate() - days);
                      const startDate = start.toISOString().split('T')[0];
                      const endDate = end.toISOString().split('T')[0];
                      if (startDate && endDate) {
                        setDateRange({
                          start: startDate,
                          end: endDate,
                        });
                      }
                    }}
                    className="px-3 py-1 text-sm text-txt-secondary hover:text-txt-primary
                               hover:bg-bg-hover rounded-md"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary table */}
            <div className="bg-bg-surface-elevated rounded-lg overflow-hidden">
              <AttendanceSummaryView
                startDate={dateRange.start}
                endDate={dateRange.end}
                onSelectAthlete={setSelectedAthleteId}
              />
            </div>

            {/* Individual history panel */}
            {selectedAthlete && (
              <div className="p-4 bg-bg-surface-elevated rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-txt-primary">Individual History</h3>
                  <button
                    onClick={() => setSelectedAthleteId(null)}
                    className="text-sm text-txt-secondary hover:text-txt-primary"
                  >
                    Close
                  </button>
                </div>
                <AttendanceHistory
                  athleteId={selectedAthlete.id}
                  athleteName={`${selectedAthlete.firstName} ${selectedAthlete.lastName}`}
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Help */}
      <TrainingShortcutsHelp
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        shortcuts={shortcuts}
      />
    </div>
  );
}
