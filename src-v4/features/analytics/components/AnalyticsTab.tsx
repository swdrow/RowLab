/**
 * AnalyticsTab -- orchestrator for the Analytics profile tab.
 *
 * Wires PMC chart (range selector, sport filter, data sufficiency banner),
 * Volume Trends (summary stats, grouped bar chart, toggles),
 * and Training Insights (data-gated action banners) together.
 * Manages local filter state and data fetching for all sections.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ErrorState } from '@/components/ui/ErrorState';

import { useAnalyticsPMC, useAnalyticsVolume } from '../api';
import { PMCChart } from './PMCChart';
import { RangeSelector } from './RangeSelector';
import { SportFilter } from './SportFilter';
import { DataSufficiencyBanner } from './DataSufficiencyBanner';
import { VolumeChart } from './VolumeChart';
import { AnalyticsSummaryStats } from './AnalyticsSummaryStats';
import { TrainingInsights } from './TrainingInsights';
import { AnalyticsSettingsCallout } from './AnalyticsSettingsCallout';
import type { PMCRange, VolumeRange, VolumeGranularity, VolumeMetric } from '../types';

/* ------------------------------------------------------------------ */
/* Skeleton loader                                                     */
/* ------------------------------------------------------------------ */

function PMCChartSkeleton() {
  return (
    <div className="space-y-4 animate-shimmer">
      {/* Header row skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-5 w-56 rounded bg-edge-default/50" />
        <div className="flex gap-2">
          <div className="h-8 w-48 rounded-lg bg-edge-default/50" />
          <div className="h-8 w-28 rounded-lg bg-edge-default/50" />
        </div>
      </div>
      {/* Chart area skeleton */}
      <div className="h-[250px] md:h-[350px] rounded-xl bg-edge-default/30" />
      {/* Values row skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-edge-default/30" />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Current values display                                              */
/* ------------------------------------------------------------------ */

interface ValueCardProps {
  label: string;
  value: number | null;
  colorClass: string;
  format?: (v: number) => string;
}

function ValueCard({ label, value, colorClass, format }: ValueCardProps) {
  const isNull = value == null;
  const display = isNull ? '\u2014' : format ? format(value) : value.toFixed(1);

  return (
    <div className="rounded-xl border border-edge-default bg-void-raised px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-text-faint font-medium mb-1">
        {label}
      </p>
      <p
        className={`text-lg font-mono tabular-nums font-semibold ${isNull ? 'text-text-faint' : colorClass}`}
      >
        {display}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Volume skeleton loader                                              */
/* ------------------------------------------------------------------ */

function VolumeChartSkeleton() {
  return (
    <div className="space-y-4 animate-shimmer">
      {/* Summary stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-edge-default/30" />
        ))}
      </div>
      {/* Chart skeleton */}
      <div className="rounded-xl bg-edge-default/30 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-32 rounded bg-edge-default/50" />
          <div className="flex gap-2">
            <div className="h-7 w-36 rounded-lg bg-edge-default/50" />
            <div className="h-7 w-32 rounded-lg bg-edge-default/50" />
          </div>
        </div>
        <div className="h-[220px] md:h-[300px] rounded-lg bg-edge-default/20" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AnalyticsTab                                                        */
/* ------------------------------------------------------------------ */

export function AnalyticsTab() {
  const [range, setRange] = useState<PMCRange>('90d');
  const [sport, setSport] = useState<string | null>(null);
  const navigate = useNavigate();

  // Volume local state
  const [volumeRange] = useState<VolumeRange>('12w');
  const [volumeGranularity, setVolumeGranularity] = useState<VolumeGranularity>('weekly');
  const [volumeMetric, setVolumeMetric] = useState<VolumeMetric>('distance');

  const { data, isLoading, isError, refetch } = useAnalyticsPMC(range, sport);
  const { data: volumeData, isLoading: volumeLoading } = useAnalyticsVolume(
    volumeRange,
    volumeGranularity,
    volumeMetric
  );

  const handleVolumeBarClick = useCallback(
    (startDate: string, endDate: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      void (navigate as any)({
        to: '/workouts',
        search: { dateFrom: startDate, dateTo: endDate },
      });
    },
    [navigate]
  );

  const handleDayClick = useCallback(
    (date: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      void (navigate as any)({
        to: '/workouts',
        search: { dateFrom: date, dateTo: date },
      });
    },
    [navigate]
  );

  if (isLoading) return <PMCChartSkeleton />;

  if (isError) {
    return (
      <div className="flex justify-center py-12">
        <ErrorState
          title="Failed to load analytics"
          message="Could not fetch performance data. Please try again."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Settings callout (dismissible) */}
      <AnalyticsSettingsCallout hasCustomSettings={data.hasCustomSettings} />

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-sm font-display font-semibold text-text-bright">
          Performance Management Chart
        </h3>
        <div className="flex items-center gap-2">
          <RangeSelector value={range} onChange={setRange} />
          <SportFilter value={sport} onChange={setSport} />
        </div>
      </div>

      {/* Data sufficiency banner */}
      <DataSufficiencyBanner daysWithData={data.daysWithData} daysNeeded={42} />

      {/* PMC Chart */}
      <div className="rounded-xl border border-edge-default bg-void-raised p-4">
        <PMCChart
          data={data.points}
          currentCTL={data.currentCTL}
          currentATL={data.currentATL}
          currentTSB={data.currentTSB}
          onDayClick={handleDayClick}
        />
      </div>

      {/* Current values row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ValueCard label="Fitness (CTL)" value={data.currentCTL} colorClass="text-data-good" />
        <ValueCard label="Fatigue (ATL)" value={data.currentATL} colorClass="text-data-poor" />
        <ValueCard label="Form (TSB)" value={data.currentTSB} colorClass="text-data-excellent" />
        <ValueCard
          label="ACWR"
          value={data.acwr}
          colorClass={
            data.acwr != null && data.acwr > 1.5
              ? 'text-data-poor'
              : data.acwr != null && data.acwr > 1.2
                ? 'text-data-warning'
                : 'text-data-good'
          }
          format={(v) => v.toFixed(2)}
        />
      </div>

      {/* Volume Trends Section */}
      <section className="mt-10">
        {volumeLoading && <VolumeChartSkeleton />}
        {volumeData && (
          <>
            <AnalyticsSummaryStats
              summary={volumeData.summary}
              metric={volumeMetric}
              granularity={volumeGranularity}
              buckets={volumeData.buckets}
            />
            <VolumeChart
              data={volumeData.buckets}
              rollingAverage={volumeData.rollingAverage}
              metric={volumeMetric}
              granularity={volumeGranularity}
              onMetricChange={setVolumeMetric}
              onGranularityChange={setVolumeGranularity}
              onBarClick={handleVolumeBarClick}
            />
          </>
        )}
      </section>

      {/* Training Insights */}
      <section className="mt-10">
        <TrainingInsights
          insights={data.insights ?? []}
          daysWithData={data.daysWithData ?? 0}
          isReliable={(data.daysWithData ?? 0) >= 42}
        />
      </section>
    </div>
  );
}
