/**
 * PMCChart -- Performance Management Chart visualization.
 *
 * Renders CTL (fitness), ATL (fatigue), TSB (form) lines with daily TSS bars
 * and TSB zone background bands using recharts ComposedChart. CSS variable
 * tokens for all colors following TrendChart pattern.
 *
 * Performance: For "All" range with >365 data points, downsamples to weekly
 * averages to avoid recharts rendering bottlenecks.
 */

import { useCallback, useMemo, useState } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';

import type { PMCDataPoint } from '../types';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const GRID_COLOR = 'var(--color-edge-default)';
const TICK_COLOR = 'var(--color-text-faint)';

/** Resolved CSS variable colors (needs runtime getComputedStyle) */
function resolveChartColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    ctl: style.getPropertyValue('--color-data-good').trim() || 'oklch(0.62 0.17 255)',
    atl: style.getPropertyValue('--color-data-poor').trim() || 'oklch(0.58 0.2 25)',
    tsb: style.getPropertyValue('--color-data-excellent').trim() || 'oklch(0.72 0.17 142)',
    tssBar: 'oklch(1 0 0 / 0.08)',
    grid: style.getPropertyValue('--color-edge-default').trim() || 'oklch(0.3 0 0)',
  };
}

/* ------------------------------------------------------------------ */
/* TSB Zone bands config                                               */
/* ------------------------------------------------------------------ */

/** Zone layout (resolved colors are injected at runtime via resolveTsbZones) */
interface TsbZone {
  y1: number;
  y2: number;
  fill: string;
  opacity: number;
  label: string;
  textFill: string;
}

function resolveTsbZones(): TsbZone[] {
  const style = getComputedStyle(document.documentElement);
  const poor = style.getPropertyValue('--color-data-poor').trim() || 'oklch(0.58 0.2 25)';
  const warning = style.getPropertyValue('--color-data-warning').trim() || 'oklch(0.75 0.14 75)';
  const excellent =
    style.getPropertyValue('--color-data-excellent').trim() || 'oklch(0.72 0.17 142)';
  const good = style.getPropertyValue('--color-data-good').trim() || 'oklch(0.62 0.17 255)';

  return [
    {
      y1: -50,
      y2: -10,
      fill: poor,
      opacity: 0.06,
      label: 'Stale',
      textFill: poor,
    },
    {
      y1: -10,
      y2: 5,
      fill: warning,
      opacity: 0.04,
      label: 'Grey Zone',
      textFill: warning,
    },
    {
      y1: 5,
      y2: 25,
      fill: excellent,
      opacity: 0.06,
      label: 'Optimal',
      textFill: excellent,
    },
    {
      y1: 25,
      y2: 50,
      fill: good,
      opacity: 0.04,
      label: 'Transition',
      textFill: good,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Downsampling for large datasets                                     */
/* ------------------------------------------------------------------ */

function downsampleToWeekly(points: PMCDataPoint[]): PMCDataPoint[] {
  if (points.length <= 365) return points;

  const weeks: PMCDataPoint[][] = [];
  let currentWeek: PMCDataPoint[] = [];
  let currentWeekStart: string | null = null;

  for (const point of points) {
    const d = new Date(point.date);
    // ISO week start (Monday)
    const day = d.getDay();
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - ((day + 6) % 7));
    const weekKey = weekStart.toISOString().slice(0, 10);

    if (currentWeekStart !== weekKey) {
      if (currentWeek.length > 0) weeks.push(currentWeek);
      currentWeek = [];
      currentWeekStart = weekKey;
    }
    currentWeek.push(point);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  return weeks.map((week) => {
    const last = week[week.length - 1]!;
    const avgTss = week.reduce((s, p) => s + p.tss, 0) / week.length;
    // Use end-of-week CTL/ATL/TSB (they're cumulative, not averageable)
    return {
      date: last.date,
      ctl: last.ctl,
      atl: last.atl,
      tsb: last.tsb,
      tss: avgTss,
      byType: last.byType,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Date formatter                                                      */
/* ------------------------------------------------------------------ */

function formatDateTick(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  return `${month} ${d.getDate()}`;
}

/* ------------------------------------------------------------------ */
/* Custom Tooltip                                                      */
/* ------------------------------------------------------------------ */

function PMCTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0]?.payload as PMCDataPoint | undefined;
  if (!data) return null;

  const d = new Date(label as string);
  const dateLabel = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const tsbColor = data.tsb >= 0 ? 'text-data-good' : 'text-data-poor';

  return (
    <div className="bg-void-raised border border-edge-default rounded-xl px-4 py-3 shadow-md min-w-[180px]">
      <p className="text-[10px] uppercase tracking-wider text-text-faint font-medium mb-2">
        {dateLabel}
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-data-good" />
          <span className="text-sm text-text-dim">CTL:</span>
          <span className="text-sm font-semibold text-text-bright tabular-nums">
            {data.ctl.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-data-poor" />
          <span className="text-sm text-text-dim">ATL:</span>
          <span className="text-sm font-semibold text-text-bright tabular-nums">
            {data.atl.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-data-excellent" />
          <span className="text-sm text-text-dim">TSB:</span>
          <span className={`text-sm font-semibold tabular-nums ${tsbColor}`}>
            {data.tsb.toFixed(1)}
          </span>
        </div>
        {data.tss > 0 && (
          <div className="pt-1 mt-1 border-t border-edge-default/50">
            <span className="text-xs text-text-faint tabular-nums">
              Daily TSS: {data.tss.toFixed(0)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Custom Legend                                                        */
/* ------------------------------------------------------------------ */

interface LegendEntry {
  key: string;
  label: string;
  colorClass: string;
  currentValue: number;
}

function PMCLegend({
  entries,
  hidden,
  onToggle,
}: {
  entries: LegendEntry[];
  hidden: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 px-1">
      {entries.map((entry) => {
        const isHidden = hidden.has(entry.key);
        return (
          <button
            key={entry.key}
            type="button"
            onClick={() => onToggle(entry.key)}
            className={`flex items-center gap-1.5 text-xs transition-opacity ${
              isHidden ? 'opacity-30' : 'opacity-100'
            }`}
          >
            <span className={`inline-block w-2.5 h-0.5 rounded-full ${entry.colorClass}`} />
            <span className="text-text-dim">
              {entry.label}:{' '}
              <span className="font-mono text-text-bright">{entry.currentValue.toFixed(1)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PMCChart                                                            */
/* ------------------------------------------------------------------ */

interface PMCChartProps {
  data: PMCDataPoint[];
  currentCTL: number;
  currentATL: number;
  currentTSB: number;
  onDayClick?: (date: string) => void;
}

export function PMCChart({ data, currentCTL, currentATL, currentTSB, onDayClick }: PMCChartProps) {
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());

  const chartColors = useMemo(resolveChartColors, []);
  const tsbZones = useMemo(resolveTsbZones, []);
  const chartData = useMemo(() => downsampleToWeekly(data), [data]);

  const toggleLine = useCallback((key: string) => {
    setHiddenLines((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleChartClick = useCallback(
    (state: { activePayload?: Array<{ payload: PMCDataPoint }> } | null) => {
      if (!state?.activePayload?.[0] || !onDayClick) return;
      const date = state.activePayload[0].payload.date;
      onDayClick(date);
    },
    [onDayClick]
  );

  const legendEntries: LegendEntry[] = [
    { key: 'ctl', label: 'Fitness (CTL)', colorClass: 'bg-data-good', currentValue: currentCTL },
    { key: 'atl', label: 'Fatigue (ATL)', colorClass: 'bg-data-poor', currentValue: currentATL },
    { key: 'tsb', label: 'Form (TSB)', colorClass: 'bg-data-excellent', currentValue: currentTSB },
  ];

  if (chartData.length === 0) {
    return (
      <div className="h-[250px] md:h-[350px] flex items-center justify-center">
        <p className="text-sm text-text-faint">No PMC data available</p>
      </div>
    );
  }

  // Calculate Y-axis domains
  const allCtl = chartData.map((p) => p.ctl);
  const allAtl = chartData.map((p) => p.atl);
  const allTss = chartData.map((p) => p.tss);
  const maxLeft = Math.max(...allCtl, ...allAtl, ...allTss) * 1.15;
  const allTsb = chartData.map((p) => p.tsb);
  const tsbMin = Math.min(...allTsb, -50);
  const tsbMax = Math.max(...allTsb, 50);

  return (
    <div>
      <div className="h-[250px] md:h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 8, bottom: 4, left: 4 }}
            onClick={handleChartClick}
          >
            {/* Gradient definitions for CTL area fill */}
            <defs>
              <linearGradient id="ctlFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColors.ctl} stopOpacity={0.15} />
                <stop offset="100%" stopColor={chartColors.ctl} stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* TSB zone bands with labels */}
            {tsbZones.map((zone) => (
              <ReferenceArea
                key={zone.label}
                yAxisId="tsb"
                y1={zone.y1}
                y2={zone.y2}
                fill={zone.fill}
                fillOpacity={zone.opacity}
                ifOverflow="hidden"
                label={{
                  value: zone.label,
                  position: 'insideTopRight',
                  fontSize: 10,
                  fontWeight: 500,
                  fill: zone.textFill,
                  dx: -8,
                  dy: 4,
                }}
              />
            ))}

            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />

            <XAxis
              dataKey="date"
              tickFormatter={formatDateTick}
              tick={{ fontSize: 10, fill: TICK_COLOR }}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
            />

            {/* Left Y-axis: CTL, ATL, TSS */}
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: TICK_COLOR }}
              axisLine={false}
              tickLine={false}
              width={35}
              domain={[0, Math.ceil(maxLeft)]}
            />

            {/* Right Y-axis: TSB */}
            <YAxis
              yAxisId="tsb"
              orientation="right"
              tick={{ fontSize: 10, fill: TICK_COLOR }}
              axisLine={false}
              tickLine={false}
              width={35}
              domain={[Math.floor(tsbMin * 1.1), Math.ceil(tsbMax * 1.1)]}
            />

            <Tooltip content={<PMCTooltip />} />

            {/* Legend is rendered manually below the chart */}
            <Legend content={() => null} />

            {/* Daily TSS bars */}
            <Bar
              yAxisId="left"
              dataKey="tss"
              name="Daily TSS"
              fill={chartColors.tssBar}
              barSize={2}
              isAnimationActive={false}
            />

            {/* CTL (Fitness) area fill for fitness accumulation visual */}
            {!hiddenLines.has('ctl') && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="ctl"
                name="Fitness fill"
                stroke="none"
                fill="url(#ctlFill)"
                isAnimationActive={false}
                legendType="none"
              />
            )}

            {/* CTL (Fitness) line */}
            {!hiddenLines.has('ctl') && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="ctl"
                name="Fitness (CTL)"
                stroke={chartColors.ctl}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* ATL (Fatigue) line */}
            {!hiddenLines.has('atl') && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="atl"
                name="Fatigue (ATL)"
                stroke={chartColors.atl}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* TSB (Form) line */}
            {!hiddenLines.has('tsb') && (
              <Line
                yAxisId="tsb"
                type="monotone"
                dataKey="tsb"
                name="Form (TSB)"
                stroke={chartColors.tsb}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <PMCLegend entries={legendEntries} hidden={hiddenLines} onToggle={toggleLine} />
    </div>
  );
}
