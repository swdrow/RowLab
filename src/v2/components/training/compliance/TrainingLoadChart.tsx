// src/v2/components/training/compliance/TrainingLoadChart.tsx

import React from 'react';
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
 * Uses recharts for visualization.
 */
export function TrainingLoadChart({
  data,
  showVolume = true,
  className = '',
}: TrainingLoadChartProps) {
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
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--bdr-default)" />
          <XAxis
            dataKey="week"
            stroke="var(--txt-tertiary)"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            stroke="var(--txt-tertiary)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            label={{
              value: 'TSS',
              angle: -90,
              position: 'insideLeft',
              style: { fill: 'var(--txt-secondary)', fontSize: 12 },
            }}
          />
          {showVolume && (
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="var(--txt-tertiary)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              label={{
                value: 'Volume (min)',
                angle: 90,
                position: 'insideRight',
                style: { fill: 'var(--txt-secondary)', fontSize: 12 },
              }}
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface-elevated)',
              borderColor: 'var(--bdr-default)',
              borderRadius: '0.5rem',
            }}
            labelStyle={{ color: 'var(--txt-primary)' }}
            itemStyle={{ color: 'var(--txt-secondary)' }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '1rem' }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="tss"
            name="Training Stress Score"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
          {showVolume && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="volume"
              name="Volume (minutes)"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: '#22c55e', r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TrainingLoadChart;
