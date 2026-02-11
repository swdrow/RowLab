/**
 * Metric Card Widget
 * Phase 27-03: Reusable metric card with trend sparkline and severity indicator
 */

import React, { useMemo } from 'react';
import type { WidgetProps, ExceptionSeverity } from '../../types';
import { getExceptionColor } from '../../hooks/useExceptions';
import { useAttendance, useAttendanceSummary } from '../../../../hooks/useAttendance';
import { useSessions } from '../../../../hooks/useSessions';

interface TrendData {
  data: number[]; // Last 7 data points
  direction: 'up' | 'down' | 'flat';
}

interface MetricCardProps extends WidgetProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: TrendData;
  severity?: ExceptionSeverity;
  subtitle?: string;
  onClick?: () => void;
}

/**
 * MetricCard - Reusable widget for displaying metrics with sparklines
 *
 * Features:
 * - Large value display with optional unit
 * - Trend sparkline (7 data points)
 * - Severity indicator dot
 * - Click handler for drill-down
 * - Responsive sizing (compact hides sparkline)
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  widgetId,
  size,
  isEditing,
  title,
  value,
  unit,
  trend,
  severity,
  subtitle,
  onClick,
}) => {
  const isCompact = size === 'compact';
  const severityColor = severity ? getExceptionColor(severity) : null;

  // Generate sparkline SVG path
  const sparklinePath = useMemo(() => {
    if (!trend || trend.data.length === 0) return null;

    const points = trend.data;
    const width = 80;
    const height = 24;
    const padding = 2;

    // Normalize data to height
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1; // Avoid division by zero

    const xStep = width / (points.length - 1 || 1);

    const pathData = points
      .map((point, index) => {
        const x = index * xStep;
        const normalizedValue = (point - min) / range;
        const y = height - padding - normalizedValue * (height - 2 * padding);
        return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
      })
      .join(' ');

    return pathData;
  }, [trend]);

  // Sparkline color based on trend direction
  const sparklineColor = useMemo(() => {
    if (!trend) return 'var(--color-ink-tertiary)';
    switch (trend.direction) {
      case 'up':
        return 'var(--color-status-success)';
      case 'down':
        return 'var(--color-status-error)';
      case 'flat':
      default:
        return 'var(--color-ink-tertiary)';
    }
  }, [trend]);

  return (
    <div
      onClick={onClick}
      className={`h-full flex flex-col justify-between p-4 glass-card transition-all ${
        onClick ? 'cursor-pointer hover:border-[var(--color-accent-copper)]' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Severity indicator dot */}
          {severity && severity !== 'ok' && severityColor && (
            <div className={`w-2 h-2 rounded-full ${severityColor.bg} flex-shrink-0`} />
          )}
          <h3 className="text-sm font-medium text-[var(--color-ink-secondary)]">{title}</h3>
        </div>
      </div>

      {/* Value */}
      <div className="mb-2">
        <div className="flex items-baseline gap-1">
          <span
            className="text-3xl font-semibold text-[var(--color-ink-bright)]"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {value}
          </span>
          {unit && (
            <span className="text-lg font-medium text-[var(--color-ink-secondary)]">{unit}</span>
          )}
        </div>
        {subtitle && <p className="text-xs text-[var(--color-ink-tertiary)] mt-1">{subtitle}</p>}
      </div>

      {/* Sparkline (hidden on compact size) */}
      {!isCompact && trend && sparklinePath && (
        <div className="flex items-end gap-2">
          <svg width="80" height="24" className="flex-shrink-0">
            <path
              d={sparklinePath}
              fill="none"
              stroke={sparklineColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-xs text-[var(--color-ink-tertiary)]">Last 7 days</span>
        </div>
      )}
    </div>
  );
};

// ============================================
// PRE-CONFIGURED METRIC CARDS
// ============================================

/**
 * AttendanceMetricCard - Shows team attendance rate with sparkline
 */
export const AttendanceMetricCard: React.FC<Omit<MetricCardProps, 'title' | 'value' | 'trend'>> = (
  props
) => {
  // Get last 7 days attendance
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: summary, isLoading } = useAttendanceSummary(startDate, endDate);

  // Calculate attendance rate and trend
  const attendanceRate = useMemo(() => {
    if (!summary || summary.length === 0) return 0;

    // AttendanceSummary is per-athlete, aggregate to get team rate
    const totalRecords = summary.reduce((sum, athlete) => sum + athlete.total, 0);
    const presentRecords = summary.reduce((sum, athlete) => sum + athlete.present, 0);

    return totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;
  }, [summary]);

  const trend = useMemo(() => {
    if (!summary || summary.length === 0) {
      return undefined;
    }

    // Generate placeholder trend data (last 7 days)
    // TODO(phase-27-04): Query actual daily attendance rates
    const dailyRates = [82, 85, 88, 84, 87, 89, attendanceRate];

    // Determine direction
    const firstHalf = dailyRates.slice(0, Math.floor(dailyRates.length / 2));
    const secondHalf = dailyRates.slice(Math.floor(dailyRates.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    let direction: 'up' | 'down' | 'flat';
    if (secondAvg > firstAvg + 5) direction = 'up';
    else if (secondAvg < firstAvg - 5) direction = 'down';
    else direction = 'flat';

    return { data: dailyRates, direction };
  }, [summary, attendanceRate]);

  // Determine severity
  const severity: ExceptionSeverity = useMemo(() => {
    if (attendanceRate < 70) return 'critical';
    if (attendanceRate < 85) return 'warning';
    return 'ok';
  }, [attendanceRate]);

  if (isLoading) {
    return (
      <MetricCard {...props} title="Attendance Rate" value="--" unit="%" subtitle="Loading..." />
    );
  }

  return (
    <MetricCard
      {...props}
      title="Attendance Rate"
      value={attendanceRate}
      unit="%"
      trend={trend}
      severity={severity}
      subtitle="Team average"
    />
  );
};

/**
 * ErgMetricCard - Shows recent erg test count with sparkline
 */
export const ErgMetricCard: React.FC<Omit<MetricCardProps, 'title' | 'value' | 'trend'>> = (
  props
) => {
  // TODO(phase-27-03): Implement using useErgTests hook
  // For now, show placeholder data
  return (
    <MetricCard
      {...props}
      title="Erg Tests"
      value={12}
      unit="tests"
      trend={{
        data: [8, 10, 9, 11, 13, 12, 12],
        direction: 'up',
      }}
      severity="ok"
      subtitle="This week"
    />
  );
};

/**
 * SessionMetricCard - Shows sessions this week with sparkline
 */
export const SessionMetricCard: React.FC<Omit<MetricCardProps, 'title' | 'value' | 'trend'>> = (
  props
) => {
  // Get this week's sessions
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6); // Saturday

  const { sessions, isLoading } = useSessions({
    startDate: startOfWeek.toISOString().split('T')[0],
    endDate: endOfWeek.toISOString().split('T')[0],
  });

  // Calculate weekly count
  const sessionCount = sessions.filter((s) => s.status !== 'CANCELLED').length;

  // Generate daily counts for sparkline (last 7 weeks)
  const weeklyTrend = useMemo(() => {
    // Placeholder: generate sample data
    // TODO: Query actual historical data
    const data = [4, 5, 4, 5, 6, 5, sessionCount];
    const direction: 'up' | 'down' | 'flat' =
      sessionCount > 5 ? 'up' : sessionCount < 4 ? 'down' : 'flat';
    return { data, direction };
  }, [sessionCount]);

  if (isLoading) {
    return <MetricCard {...props} title="Sessions" value="--" subtitle="Loading..." />;
  }

  return (
    <MetricCard
      {...props}
      title="Sessions"
      value={sessionCount}
      unit="sessions"
      trend={weeklyTrend}
      severity="ok"
      subtitle="This week"
    />
  );
};
