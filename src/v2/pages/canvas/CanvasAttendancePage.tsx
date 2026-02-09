/**
 * CanvasAttendancePage - Attendance tracking with Canvas design
 *
 * Canvas-specific elements:
 * - Ruled headers (NOT card titles)
 * - Flat calendar cells (NO chamfer on calendar grids — breaks alignment)
 * - ScrambleNumber for all stats
 * - CanvasLogEntry for athlete rows
 * - Console readout for aggregate stats
 * - Canvas button primitives for all actions
 *
 * Feature parity with V2 AttendancePage:
 * - Daily/Summary tabs
 * - Date navigation
 * - Quick mark P/L/E/U buttons
 * - Bulk "Mark All Present"
 * - Attendance streaks
 * - Live attendance panel during active sessions
 * - Individual athlete history
 */

import { useState, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { RuledHeader, CanvasConsoleReadout, CanvasButton, CanvasTabs } from '@v2/components/canvas';
import { AttendanceSummary as AttendanceSummaryView } from '@v2/components/athletes/AttendanceSummary';
import { AttendanceHistory } from '@v2/components/athletes/AttendanceHistory';
import { AthleteAvatar } from '@v2/components/athletes/AthleteAvatar';
import { QuickMarkAttendance } from '@v2/features/attendance/components/QuickMarkAttendance';
import { AttendanceStreakBadge } from '@v2/features/attendance/components/AttendanceStreakBadge';
import { LiveAttendancePanel } from '@v2/features/attendance/components/LiveAttendancePanel';
import { AttendanceSkeleton } from '@v2/features/attendance/components/AttendanceSkeleton';
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

export function CanvasAttendancePage() {
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

  // Keyboard shortcuts
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

  // Sort: unmarked first, then marked by status order
  const sortedAthletes = useMemo(() => {
    return [...athletes].sort((a, b) => {
      const aStatus = attendanceMap[a.id]?.status;
      const bStatus = attendanceMap[b.id]?.status;

      if (!aStatus && bStatus) return -1;
      if (aStatus && !bStatus) return 1;

      if (!aStatus && !bStatus) {
        return a.lastName.localeCompare(b.lastName);
      }

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

  const unmarkedCount = sortedAthletes.filter((a) => !attendanceMap[a.id]?.status).length;

  const tabs = [
    { id: 'daily' as const, label: 'Daily' },
    { id: 'summary' as const, label: 'Summary' },
  ];

  return (
    <div className="h-full bg-void text-ink-primary">
      {/* Page Header — text against void */}
      <div className="relative px-6 pt-8 pb-6 mb-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted mb-2">
              TEAM
            </p>
            <h1 className="text-4xl font-display font-bold text-ink-bright tracking-tight">
              Attendance
            </h1>
            <p className="text-sm text-ink-secondary mt-2">Record and track practice attendance</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 mb-4">
        <CanvasTabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as Tab)} />
      </div>

      {/* Content */}
      <div className={`px-6 pb-4 ${hasActiveSession ? 'border-l-2 border-data-excellent/20' : ''}`}>
        {/* Live Attendance Panel */}
        <AnimatePresence>
          {hasActiveSession && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <LiveAttendancePanel date={selectedDate} />
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === 'daily' ? (
          <div className="space-y-4">
            {/* Date navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CanvasButton
                  variant="ghost"
                  onClick={() => navigateDate('prev')}
                  aria-label="Previous day"
                >
                  <ChevronLeft size={20} />
                </CanvasButton>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 bg-ink-raised border border-white/[0.04]
                             text-ink-primary font-mono text-sm
                             focus:outline-none focus:border-accent-primary/50 transition-colors"
                />

                <CanvasButton
                  variant="ghost"
                  onClick={() => navigateDate('next')}
                  aria-label="Next day"
                >
                  <ChevronRight size={20} />
                </CanvasButton>
              </div>

              <span className="text-ink-secondary text-sm font-mono">{formattedDate}</span>
            </div>

            {/* Stats console + bulk action */}
            <div className="flex items-center justify-between">
              <CanvasConsoleReadout
                items={[
                  { label: 'PRESENT', value: String(stats.present) },
                  { label: 'LATE', value: String(stats.late) },
                  { label: 'EXCUSED', value: String(stats.excused) },
                  { label: 'UNEXCUSED', value: String(stats.unexcused) },
                  ...(stats.unmarked > 0
                    ? [{ label: 'UNMARKED', value: String(stats.unmarked) }]
                    : []),
                ]}
              />

              <CanvasButton
                variant="primary"
                onClick={handleMarkAllPresent}
                disabled={isBulkRecording}
                className="flex items-center gap-2"
              >
                <CheckCircle size={18} />
                Mark All Present
              </CanvasButton>
            </div>

            {/* Roster */}
            {attendanceLoading ? (
              <AttendanceSkeleton rowCount={6} />
            ) : athletes.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-ink-muted font-mono text-sm">[NO ATHLETES IN ROSTER]</p>
                <p className="text-ink-muted text-xs mt-2">Add athletes to track attendance</p>
              </div>
            ) : (
              <div className="space-y-1">
                {sortedAthletes.map((athlete, index) => {
                  const currentStatus = attendanceMap[athlete.id]?.status;
                  const streak = streakMap[athlete.id] ?? 0;

                  const isFirstMarked =
                    index === unmarkedCount && unmarkedCount > 0 && unmarkedCount < athletes.length;

                  return (
                    <div key={athlete.id}>
                      {isFirstMarked && (
                        <div className="flex items-center gap-3 py-3">
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-accent-primary/20 to-accent-primary/20" />
                          <span className="text-[10px] text-accent-primary uppercase tracking-[0.2em] font-semibold">
                            MARKED
                          </span>
                          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-accent-primary/20 to-accent-primary/20" />
                        </div>
                      )}

                      <div
                        className={`flex items-center gap-4 p-3 bg-ink-raised border transition-all ${
                          currentStatus
                            ? 'border-white/[0.04]'
                            : 'border-accent-primary/30 shadow-sm'
                        }`}
                      >
                        <AthleteAvatar
                          firstName={athlete.firstName}
                          lastName={athlete.lastName}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-ink-primary truncate">
                              {athlete.lastName}, {athlete.firstName}
                            </span>
                            {athlete.side && (
                              <span className="text-xs text-ink-muted flex-shrink-0">
                                ({athlete.side})
                              </span>
                            )}
                          </div>
                          {streak > 0 && (
                            <div className="mt-1">
                              <AttendanceStreakBadge streak={streak} size="sm" />
                            </div>
                          )}
                        </div>

                        {/* P/L/E/U buttons */}
                        <div className="flex-shrink-0">
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
                <label className="text-sm text-ink-muted font-mono uppercase tracking-wider">
                  FROM:
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="px-3 py-2 bg-ink-raised border border-white/[0.04]
                             text-ink-primary font-mono text-sm
                             focus:outline-none focus:border-accent-primary/50 transition-colors"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-ink-muted font-mono uppercase tracking-wider">
                  TO:
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="px-3 py-2 bg-ink-raised border border-white/[0.04]
                             text-ink-primary font-mono text-sm
                             focus:outline-none focus:border-accent-primary/50 transition-colors"
                />
              </div>

              {/* Quick presets */}
              <div className="flex gap-2">
                {[
                  { label: '7D', days: 7 },
                  { label: '30D', days: 30 },
                  { label: '90D', days: 90 },
                ].map(({ label, days }) => (
                  <CanvasButton
                    key={label}
                    variant="ghost"
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(start.getDate() - days);
                      const startDate = start.toISOString().split('T')[0];
                      const endDate = end.toISOString().split('T')[0];
                      if (startDate && endDate) {
                        setDateRange({ start: startDate, end: endDate });
                      }
                    }}
                  >
                    {label}
                  </CanvasButton>
                ))}
              </div>
            </div>

            {/* Summary table with ruled header */}
            <div>
              <RuledHeader className="mb-3">ATTENDANCE SUMMARY</RuledHeader>
              <div className="bg-ink-raised border border-white/[0.04] overflow-hidden">
                <AttendanceSummaryView
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                  onSelectAthlete={setSelectedAthleteId}
                />
              </div>
            </div>

            {/* Individual history panel */}
            {selectedAthlete && (
              <div className="p-6 bg-ink-raised border border-white/[0.04]">
                <div className="flex items-center gap-3 mb-4">
                  <RuledHeader className="flex-1">INDIVIDUAL HISTORY</RuledHeader>
                  <CanvasButton variant="ghost" onClick={() => setSelectedAthleteId(null)}>
                    CLOSE
                  </CanvasButton>
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

export default CanvasAttendancePage;
