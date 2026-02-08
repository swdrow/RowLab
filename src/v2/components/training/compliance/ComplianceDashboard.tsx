// src/v2/components/training/compliance/ComplianceDashboard.tsx

import React, { useState, useMemo } from 'react';
import { format, startOfWeek, subWeeks, addWeeks } from 'date-fns';
import { useNcaaWeeklyHours, useTrainingLoad } from '../../../hooks/useNcaaCompliance';
import { WeeklyHoursTable } from './WeeklyHoursTable';
import { TrainingLoadChart } from './TrainingLoadChart';
import { AttendanceTrainingLinkPanel } from './AttendanceTrainingLinkPanel';

interface PracticeSession {
  id: string;
  date: string;
  duration: number;
  type: string;
  notes?: string;
}

interface NCAAAuditEntry {
  athleteId: string;
  athleteName: string;
  weekStart: string;
  totalHours: number;
  dailyHours: {
    date: string;
    hours: number;
  }[];
  isNearLimit: boolean;
  isOverLimit: boolean;
  sessions: PracticeSession[];
}

interface ComplianceDashboardProps {
  onAthleteClick?: (athleteId: string) => void;
  className?: string;
}

type TabType = 'hours' | 'load' | 'attendance';

/**
 * Coach dashboard showing training compliance, NCAA hours, training load,
 * and attendance linked to training sessions (ATT-04).
 */
export function ComplianceDashboard({ onAthleteClick, className = '' }: ComplianceDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('hours');
  const [weekOffset, setWeekOffset] = useState(0);

  const currentDate = new Date();
  const weekStart = startOfWeek(addWeeks(currentDate, weekOffset), { weekStartsOn: 1 });

  // Get 8 weeks of load data for charts
  const loadStartDate = subWeeks(weekStart, 7);
  const loadEndDate = addWeeks(weekStart, 1);

  const { entries: complianceEntries, isLoading: loadingCompliance } =
    useNcaaWeeklyHours(weekStart);
  const { weeks: loadData, isLoading: loadingLoad } = useTrainingLoad(loadStartDate, loadEndDate);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const athletesOver = complianceEntries.filter((e: NCAAAuditEntry) => e.isOverLimit).length;
    const athletesNear = complianceEntries.filter(
      (e: NCAAAuditEntry) => e.isNearLimit && !e.isOverLimit
    ).length;
    const totalAthletes = complianceEntries.length;
    const avgHours =
      totalAthletes > 0
        ? complianceEntries.reduce((sum: number, e: NCAAAuditEntry) => sum + e.totalHours, 0) /
          totalAthletes
        : 0;

    return {
      athletesOver,
      athletesNear,
      totalAthletes,
      avgHours,
    };
  }, [complianceEntries]);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'hours', label: 'NCAA Hours' },
    { key: 'load', label: 'Training Load' },
    { key: 'attendance', label: 'Attendance' },
  ];

  const navigateWeek = (direction: 'prev' | 'next') => {
    setWeekOffset((prev) => (direction === 'next' ? prev + 1 : prev - 1));
  };

  const isLoading = loadingCompliance || loadingLoad;

  return (
    <div className={`compliance-dashboard ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-txt-primary">Compliance Dashboard</h2>

        {/* Week Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 text-txt-secondary hover:text-txt-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="text-center min-w-[160px]">
            <div className="text-sm font-medium text-txt-primary">
              Week of {format(weekStart, 'MMM d, yyyy')}
            </div>
            {weekOffset === 0 && <div className="text-xs text-data-good">Current Week</div>}
          </div>
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 text-txt-secondary hover:text-txt-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4">
          <div className="text-sm text-txt-secondary">Total Athletes</div>
          <div className="text-2xl font-bold font-mono text-txt-primary mt-1">
            {summaryStats.totalAthletes}
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="text-sm text-txt-secondary">Avg Hours/Week</div>
          <div className="text-2xl font-bold font-mono text-txt-primary mt-1">
            {summaryStats.avgHours.toFixed(1)}h
          </div>
        </div>

        <div
          className={`p-4 rounded-lg border ${
            summaryStats.athletesNear > 0
              ? 'bg-data-warning/10 border-data-warning/30'
              : 'glass-card'
          }`}
        >
          <div className="text-sm text-txt-secondary">Near Limit</div>
          <div
            className={`text-2xl font-bold font-mono mt-1 ${
              summaryStats.athletesNear > 0 ? 'text-data-warning' : 'text-txt-primary'
            }`}
          >
            {summaryStats.athletesNear}
          </div>
        </div>

        <div
          className={`p-4 rounded-lg border ${
            summaryStats.athletesOver > 0 ? 'bg-data-poor/10 border-data-poor/30' : 'glass-card'
          }`}
        >
          <div className="text-sm text-txt-secondary">Over Limit</div>
          <div
            className={`text-2xl font-bold font-mono mt-1 ${
              summaryStats.athletesOver > 0 ? 'text-data-poor' : 'text-txt-primary'
            }`}
          >
            {summaryStats.athletesOver}
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {summaryStats.athletesOver > 0 && (
        <div className="mb-6 p-4 bg-data-poor/10 border border-data-poor/30 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-data-poor flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h4 className="font-medium text-data-poor">NCAA Compliance Alert</h4>
              <p className="text-sm text-txt-secondary mt-1">
                {summaryStats.athletesOver} athlete{summaryStats.athletesOver > 1 ? 's' : ''}{' '}
                exceeded the 20-hour weekly limit. Review the details below and take corrective
                action.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-bg-surface-elevated rounded-lg mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
              ${
                activeTab === tab.key
                  ? 'bg-interactive-primary text-txt-inverse'
                  : 'text-txt-secondary hover:text-txt-primary hover:bg-bg-hover'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-interactive-primary" />
        </div>
      ) : (
        <>
          {activeTab === 'hours' && (
            <div className="glass-card overflow-hidden">
              <WeeklyHoursTable entries={complianceEntries} onAthleteClick={onAthleteClick} />
            </div>
          )}

          {activeTab === 'load' && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-medium text-txt-primary mb-4">
                8-Week Training Load Trend
              </h3>
              <TrainingLoadChart data={loadData} />
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="glass-card p-6">
              <AttendanceTrainingLinkPanel onAthleteClick={onAthleteClick} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ComplianceDashboard;
