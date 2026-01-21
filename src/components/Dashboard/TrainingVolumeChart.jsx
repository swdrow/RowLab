import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * TrainingVolumeChart - Weekly/monthly training load visualization
 *
 * Displays:
 * - Bar chart showing weekly distance/hours
 * - Trend line overlay
 * - Comparison to previous period
 * - Color coding: On track (blue), Below (muted), Above (green)
 */
function TrainingVolumeChart({
  data = [],
  metric = 'distance', // 'distance' | 'hours'
  targetWeekly = null, // Optional target for comparison
  className = '',
}) {
  // Calculate trend and comparison stats
  const stats = useMemo(() => {
    if (data.length < 2) {
      return { trend: 'stable', change: 0, average: 0 };
    }

    const values = data.map(d => d.value);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const lastWeek = values[values.length - 1] || 0;
    const prevWeek = values[values.length - 2] || 0;
    const change = prevWeek > 0 ? ((lastWeek - prevWeek) / prevWeek) * 100 : 0;

    let trend = 'stable';
    if (change > 5) trend = 'up';
    else if (change < -5) trend = 'down';

    return { trend, change, average, lastWeek, prevWeek };
  }, [data]);

  // Process chart data with color coding
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      fill: targetWeekly
        ? item.value >= targetWeekly
          ? '#10B981' // Above target - green
          : item.value >= targetWeekly * 0.8
            ? '#0070F3' // On track - blue
            : 'rgba(255,255,255,0.2)' // Below - muted
        : '#0070F3', // No target - default blue
    }));
  }, [data, targetWeekly]);

  // Format values for display
  const formatValue = (value) => {
    if (metric === 'hours') {
      return `${value.toFixed(1)}h`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    const value = payload[0].value;
    return (
      <div className="bg-void-elevated border border-white/10 rounded-lg p-3 shadow-lg">
        <p className="text-text-secondary text-xs mb-1">{label}</p>
        <p className="text-text-primary font-mono text-lg">
          {metric === 'distance' ? `${value.toLocaleString()}m` : `${value.toFixed(1)} hours`}
        </p>
        {targetWeekly && (
          <p className="text-xs text-text-muted mt-1">
            Target: {metric === 'distance' ? `${targetWeekly.toLocaleString()}m` : `${targetWeekly}h`}
          </p>
        )}
      </div>
    );
  };

  const TrendIcon = stats.trend === 'up' ? TrendingUp : stats.trend === 'down' ? TrendingDown : Minus;
  const trendColor = stats.trend === 'up' ? 'text-success' : stats.trend === 'down' ? 'text-danger-red' : 'text-text-muted';

  return (
    <div className={`rounded-xl bg-void-elevated border border-white/[0.06] p-5 ${className}`}>
      {/* Header with trend indicator */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-1">Training Volume</h3>
          <p className="text-xs text-text-muted">
            {metric === 'distance' ? 'Weekly meters' : 'Weekly hours'}
          </p>
        </div>

        {/* Trend indicator */}
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md bg-void-surface border border-white/[0.06] ${trendColor}`}>
          <TrendIcon size={14} />
          <span className="text-xs font-mono">
            {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255, 255, 255, 0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.06)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.06)' }}
              tickLine={false}
              tickFormatter={formatValue}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            {targetWeekly && (
              <ReferenceLine
                y={targetWeekly}
                stroke="rgba(255,255,255,0.2)"
                strokeDasharray="4 4"
                label={{
                  value: 'Target',
                  fill: 'rgba(255,255,255,0.4)',
                  fontSize: 10,
                  position: 'right',
                }}
              />
            )}
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              fill="#0070F3"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary stats */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.04]">
        <div className="text-center flex-1">
          <div className="text-lg font-mono font-bold text-text-primary tabular-nums">
            {formatValue(stats.lastWeek || 0)}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-text-muted">This Week</div>
        </div>
        <div className="w-px h-8 bg-white/[0.06]" />
        <div className="text-center flex-1">
          <div className="text-lg font-mono text-text-secondary tabular-nums">
            {formatValue(stats.average || 0)}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-text-muted">Average</div>
        </div>
        {targetWeekly && (
          <>
            <div className="w-px h-8 bg-white/[0.06]" />
            <div className="text-center flex-1">
              <div className="text-lg font-mono text-text-muted tabular-nums">
                {formatValue(targetWeekly)}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted">Target</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TrainingVolumeChart;
