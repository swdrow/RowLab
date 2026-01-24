import { useState, useMemo } from 'react';
import { Calendar, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { AttendanceTracker } from '@v2/components/athletes/AttendanceTracker';
import { AttendanceSummary } from '@v2/components/athletes/AttendanceSummary';
import { AttendanceHistory } from '@v2/components/athletes/AttendanceHistory';
import { useAthletes } from '@v2/hooks/useAthletes';

type Tab = 'daily' | 'summary';

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<Tab>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to today
    return new Date().toISOString().split('T')[0] || '';
  });
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
    // Default to last 30 days
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

  // Find selected athlete
  const selectedAthlete = useMemo(() => {
    if (!selectedAthleteId) return null;
    return athletes.find((a) => a.id === selectedAthleteId);
  }, [athletes, selectedAthleteId]);

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

  return (
    <div className="h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-bdr-default">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-display font-semibold text-txt-primary">
              Attendance
            </h1>
            <p className="text-sm text-txt-secondary mt-1">
              Track and view team attendance
            </p>
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
      <div className="px-6 py-4">
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

            {/* Tracker */}
            <AttendanceTracker date={selectedDate} />
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
              <AttendanceSummary
                startDate={dateRange.start}
                endDate={dateRange.end}
                onSelectAthlete={setSelectedAthleteId}
              />
            </div>

            {/* Individual history panel */}
            {selectedAthlete && (
              <div className="p-4 bg-bg-surface-elevated rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-txt-primary">
                    Individual History
                  </h3>
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
    </div>
  );
}
