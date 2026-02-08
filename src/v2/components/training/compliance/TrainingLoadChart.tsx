// src/v2/components/training/compliance/TrainingLoadChart.tsx

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface WeeklyLoad {
  weekStart: string;
  weekEnd: string;
  totalMinutes: number;
  totalTSS: number;
  sessionCount: number;
  averageIntensity?: number;
}

interface TrainingLoadChartProps {
  data: WeeklyLoad[];
  showVolume?: boolean;
  className?: string;
}

/**
 * Chart showing weekly training load (TSS) and volume trends.
 * Uses recharts for visualization with V3 design token colors.
 */
export function TrainingLoadChart({
  data,
  showVolume = true,
  className = '',
}: TrainingLoadChartProps) {
  // Resolve CSS variable colors for recharts (which needs actual color values)
  const chartColors = useMemo(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      tss: style.getPropertyValue('--data-good').trim() || '#3B82F6',
      volume: style.getPropertyValue('--data-excellent').trim() || '#22C55E',
      grid: style.getPropertyValue('--color-bdr-default').trim() || '#333',
      axisText: style.getPropertyValue('--color-txt-tertiary').trim() || '#888',
      labelText: style.getPropertyValue('--color-txt-secondary').trim() || '#aaa',
      tooltipBg: style.getPropertyValue('--color-bg-surface-elevated').trim() || '#1a1a1a',
      tooltipBorder: style.getPropertyValue('--color-bdr-default').trim() || '#333',
      tooltipLabel: style.getPropertyValue('--color-txt-primary').trim() || '#fff',
      tooltipItem: style.getPropertyValue('--color-txt-secondary').trim() || '#aaa',
    };
  }, []);

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-txt-tertiary ${className}`}>
        No training load data available
      </div>
    );
  }

  // Transform data to match chart expectations
  const chartData = data.map((week) => ({
    week: new Date(week.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    tss: week.totalTSS,
    volume: week.totalMinutes,
  }));

  return (
    <div className={`training-load-chart ${className}`}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
          <XAxis dataKey="week" stroke={chartColors.axisText} fontSize={12} tickLine={false} />
          <YAxis
            yAxisId="left"
            stroke={chartColors.axisText}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            label={{
              value: 'TSS',
              angle: -90,
              position: 'insideLeft',
              style: { fill: chartColors.labelText, fontSize: 12 },
            }}
          />
          {showVolume && (
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke={chartColors.axisText}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              label={{
                value: 'Volume (min)',
                angle: 90,
                position: 'insideRight',
                style: { fill: chartColors.labelText, fontSize: 12 },
              }}
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: chartColors.tooltipBg,
              borderColor: chartColors.tooltipBorder,
              borderRadius: '0.5rem',
            }}
            labelStyle={{ color: chartColors.tooltipLabel }}
            itemStyle={{ color: chartColors.tooltipItem }}
          />
          <Legend wrapperStyle={{ paddingTop: '1rem' }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="tss"
            name="Training Stress Score"
            stroke={chartColors.tss}
            strokeWidth={2}
            dot={{ fill: chartColors.tss, r: 4 }}
            activeDot={{ r: 6 }}
          />
          {showVolume && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="volume"
              name="Volume (minutes)"
              stroke={chartColors.volume}
              strokeWidth={2}
              dot={{ fill: chartColors.volume, r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TrainingLoadChart;
