/**
 * ComplianceDashboard -- NCAA hours tracking per athlete.
 *
 * Shows summary stats (team avg, over-limit count, compliance %),
 * then a table of athletes with weekly hours, progress bars, and status.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, AlertTriangle, Users, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { complianceReportOptions, weeklyComplianceOptions } from '../api';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { fadeIn } from '@/lib/animations';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get Monday of the current week in ISO format. */
function currentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = 1
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

const NCAA_MAX_HOURS = 20;

type ComplianceStatus = 'compliant' | 'approaching' | 'over';

function getStatus(hours: number, limit: number): ComplianceStatus {
  if (hours > limit) return 'over';
  if (hours >= limit * 0.85) return 'approaching';
  return 'compliant';
}

const STATUS_STYLES: Record<ComplianceStatus, { bar: string; badge: string; text: string }> = {
  compliant: {
    bar: 'bg-data-excellent',
    badge: 'bg-data-excellent/15 text-data-excellent',
    text: 'text-data-excellent',
  },
  approaching: {
    bar: 'bg-data-warning',
    badge: 'bg-data-warning/15 text-data-warning',
    text: 'text-data-warning',
  },
  over: {
    bar: 'bg-data-poor',
    badge: 'bg-data-poor/15 text-data-poor',
    text: 'text-data-poor',
  },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ComplianceDashboardProps {
  teamId: string;
}

// ---------------------------------------------------------------------------
// ComplianceDashboard
// ---------------------------------------------------------------------------

export function ComplianceDashboard({ teamId: _teamId }: ComplianceDashboardProps) {
  const weekStart = useMemo(currentWeekStart, []);

  const { data: report, isLoading: reportLoading } = useQuery(complianceReportOptions(weekStart));

  const { data: entries = [], isLoading: entriesLoading } = useQuery(
    weeklyComplianceOptions(weekStart)
  );

  const isLoading = reportLoading || entriesLoading;

  // Aggregate entries by athlete
  const athleteData = useMemo(() => {
    const map = new Map<string, { name: string; hours: number; sessions: number }>();
    for (const entry of entries) {
      const existing = map.get(entry.athleteId);
      if (existing) {
        existing.hours += entry.hoursLogged;
        existing.sessions += 1;
      } else {
        map.set(entry.athleteId, {
          name: entry.athleteName,
          hours: entry.hoursLogged,
          sessions: 1,
        });
      }
    }
    // Sort by hours descending
    return Array.from(map.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.hours - a.hours);
  }, [entries]);

  const maxHours = report?.maxHoursLimit ?? NCAA_MAX_HOURS;

  if (isLoading) {
    return <ComplianceSkeleton />;
  }

  if (athleteData.length === 0 && !report) {
    return (
      <EmptyState
        icon={Shield}
        title="No compliance data"
        description="Compliance data will appear once athletes have logged training hours this week."
        size="sm"
      />
    );
  }

  // Compute summary stats from report or aggregate
  const totalAthletes = report?.totalAthletes ?? athleteData.length;
  const avgHours =
    report?.averageHoursPerAthlete ??
    (athleteData.length > 0
      ? athleteData.reduce((sum, a) => sum + a.hours, 0) / athleteData.length
      : 0);
  const overLimitCount =
    report?.violations?.length ?? athleteData.filter((a) => a.hours > maxHours).length;
  const complianceRate =
    totalAthletes > 0 ? Math.round(((totalAthletes - overLimitCount) / totalAthletes) * 100) : 100;

  return (
    <motion.div {...fadeIn} className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Users} label="Athletes" value={String(totalAthletes)} />
        <StatCard icon={Clock} label="Avg Hours" value={avgHours.toFixed(1)} />
        <StatCard
          icon={AlertTriangle}
          label="Over Limit"
          value={String(overLimitCount)}
          alert={overLimitCount > 0}
        />
        <StatCard
          icon={Shield}
          label="Compliance"
          value={`${complianceRate}%`}
          highlight={complianceRate === 100}
        />
      </div>

      {/* Week label */}
      <p className="text-xs text-text-faint">
        Week of{' '}
        {new Date(weekStart + 'T00:00:00').toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}{' '}
        | NCAA max: {maxHours}h/week
      </p>

      {/* Athlete table */}
      <div className="overflow-x-auto rounded-xl border border-edge-default bg-void-raised">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge-default">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-faint">
                Athlete
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-faint">
                Weekly Hours
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-faint">
                Sessions
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-faint">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {athleteData.map((athlete) => {
              const status = getStatus(athlete.hours, maxHours);
              const styles = STATUS_STYLES[status];
              const pct = Math.min((athlete.hours / maxHours) * 100, 100);

              return (
                <tr key={athlete.id} className="transition-colors hover:bg-void-deep/30">
                  <td className="px-4 py-3">
                    <span className="font-medium text-text-bright">{athlete.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-void-deep/50 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${styles.bar}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span
                        className={`font-mono text-xs font-semibold ${styles.text} min-w-[3rem] text-right`}
                      >
                        {athlete.hours.toFixed(1)}h
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono text-xs text-text-dim">{athlete.sessions}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${styles.badge}`}
                    >
                      {status === 'compliant'
                        ? 'OK'
                        : status === 'approaching'
                          ? 'Warning'
                          : 'Over'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  alert,
  highlight,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  alert?: boolean;
  highlight?: boolean;
}) {
  return (
    <Card padding="sm">
      <div className="flex items-center gap-2">
        <Icon
          className={`h-4 w-4 ${
            alert ? 'text-data-poor' : highlight ? 'text-data-excellent' : 'text-text-faint'
          }`}
        />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-faint">
          {label}
        </span>
      </div>
      <p
        className={`mt-1 text-lg font-bold font-mono ${
          alert ? 'text-data-poor' : highlight ? 'text-data-excellent' : 'text-text-bright'
        }`}
      >
        {value}
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ComplianceSkeleton() {
  return (
    <SkeletonGroup>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="panel rounded-xl p-3 space-y-2">
            <Skeleton width="4rem" height="0.625rem" />
            <Skeleton width="3rem" height="1.5rem" />
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-void-raised p-4 space-y-3 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton width="30%" height="0.875rem" />
            <Skeleton className="flex-1" height="0.5rem" />
            <Skeleton width="2.5rem" height="0.75rem" />
          </div>
        ))}
      </div>
    </SkeletonGroup>
  );
}
