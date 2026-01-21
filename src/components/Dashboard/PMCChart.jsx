import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { Info, TrendingUp, Battery, Gauge } from 'lucide-react';

/**
 * PMCChart - Performance Management Chart
 *
 * Displays long-term fitness and fatigue tracking:
 * - CTL (Chronic Training Load / Fitness) - Blue - 42-day weighted average
 * - ATL (Acute Training Load / Fatigue) - Rose - 7-day weighted average
 * - TSB (Training Stress Balance / Form) - Green/Red - CTL - ATL
 *
 * Shows placeholder with explanation if < 6 weeks of data
 */
function PMCChart({
  data = [], // Array of { date, trainingLoad } objects
  className = '',
}) {
  // Calculate PMC metrics from training load data
  const pmcData = useMemo(() => {
    if (data.length < 7) return [];

    // Sort by date
    const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate exponentially weighted moving averages
    const ctlDecay = 2 / (42 + 1); // ~42 day constant
    const atlDecay = 2 / (7 + 1);  // ~7 day constant

    let ctl = 0;
    let atl = 0;

    return sorted.map((item, index) => {
      const load = item.trainingLoad || 0;

      // Exponential weighted moving average
      ctl = ctl * (1 - ctlDecay) + load * ctlDecay;
      atl = atl * (1 - atlDecay) + load * atlDecay;

      const tsb = ctl - atl;

      return {
        date: new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        fullDate: item.date,
        ctl: Math.round(ctl),
        atl: Math.round(atl),
        tsb: Math.round(tsb),
        load,
      };
    });
  }, [data]);

  // Current values (latest data point)
  const current = pmcData.length > 0 ? pmcData[pmcData.length - 1] : null;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-void-elevated border border-white/10 rounded-lg p-3 shadow-lg min-w-[140px]">
        <p className="text-text-secondary text-xs mb-2">{data.fullDate}</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-[#0070F3]">Fitness (CTL)</span>
            <span className="font-mono text-sm text-text-primary">{data.ctl}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-[#D96570]">Fatigue (ATL)</span>
            <span className="font-mono text-sm text-text-primary">{data.atl}</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-white/10">
            <span className={`text-xs ${data.tsb >= 0 ? 'text-success' : 'text-danger-red'}`}>
              Form (TSB)
            </span>
            <span className={`font-mono text-sm font-medium ${data.tsb >= 0 ? 'text-success' : 'text-danger-red'}`}>
              {data.tsb >= 0 ? '+' : ''}{data.tsb}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Not enough data - show placeholder
  if (data.length < 42) {
    const weeksNeeded = Math.ceil((42 - data.length) / 7);
    return (
      <div className={`rounded-xl bg-void-elevated border border-white/[0.06] p-5 ${className}`}>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blade-blue/10 border border-blade-blue/20 flex items-center justify-center flex-shrink-0">
            <Gauge size={20} className="text-blade-blue" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-primary mb-1">Performance Management</h3>
            <p className="text-xs text-text-muted">CTL / ATL / TSB metrics</p>
          </div>
        </div>

        <div className="flex items-center justify-center py-8">
          <div className="text-center max-w-[240px]">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-void-surface border border-white/[0.06] flex items-center justify-center">
              <Info size={24} className="text-text-muted" />
            </div>
            <p className="text-sm text-text-secondary mb-2">
              Need more training data
            </p>
            <p className="text-xs text-text-muted">
              PMC requires ~6 weeks of data for accurate metrics.
              {weeksNeeded > 0 && ` About ${weeksNeeded} more week${weeksNeeded > 1 ? 's' : ''} needed.`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl bg-void-elevated border border-white/[0.06] p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blade-blue/10 border border-blade-blue/20 flex items-center justify-center flex-shrink-0">
            <Gauge size={20} className="text-blade-blue" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-primary mb-1">Performance Management</h3>
            <p className="text-xs text-text-muted">Fitness, fatigue & form over time</p>
          </div>
        </div>
      </div>

      {/* Current values */}
      {current && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-blade-blue/5 border border-blade-blue/10">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={12} className="text-blade-blue" />
              <span className="text-[10px] uppercase tracking-wider text-text-muted">Fitness</span>
            </div>
            <div className="text-xl font-mono font-bold text-blade-blue tabular-nums">
              {current.ctl}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#D96570]/5 border border-[#D96570]/10">
            <div className="flex items-center gap-1.5 mb-1">
              <Battery size={12} className="text-[#D96570]" />
              <span className="text-[10px] uppercase tracking-wider text-text-muted">Fatigue</span>
            </div>
            <div className="text-xl font-mono font-bold text-[#D96570] tabular-nums">
              {current.atl}
            </div>
          </div>
          <div className={`p-3 rounded-lg ${current.tsb >= 0 ? 'bg-success/5 border-success/10' : 'bg-danger-red/5 border-danger-red/10'} border`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Gauge size={12} className={current.tsb >= 0 ? 'text-success' : 'text-danger-red'} />
              <span className="text-[10px] uppercase tracking-wider text-text-muted">Form</span>
            </div>
            <div className={`text-xl font-mono font-bold tabular-nums ${current.tsb >= 0 ? 'text-success' : 'text-danger-red'}`}>
              {current.tsb >= 0 ? '+' : ''}{current.tsb}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={pmcData}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255, 255, 255, 0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.06)' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.06)' }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Zero line for TSB reference */}
            <ReferenceLine
              y={0}
              stroke="rgba(255,255,255,0.1)"
              strokeDasharray="4 4"
            />

            {/* TSB area fill */}
            <Area
              type="monotone"
              dataKey="tsb"
              fill="url(#tsbGradient)"
              stroke="none"
              fillOpacity={0.3}
            />

            {/* CTL line (Fitness) */}
            <Line
              type="monotone"
              dataKey="ctl"
              stroke="#0070F3"
              strokeWidth={2}
              dot={false}
              activeDot={{ fill: '#0070F3', stroke: '#fff', strokeWidth: 2, r: 4 }}
            />

            {/* ATL line (Fatigue) */}
            <Line
              type="monotone"
              dataKey="atl"
              stroke="#D96570"
              strokeWidth={2}
              dot={false}
              activeDot={{ fill: '#D96570', stroke: '#fff', strokeWidth: 2, r: 4 }}
            />

            {/* TSB line (Form) */}
            <Line
              type="monotone"
              dataKey="tsb"
              stroke="#22C55E"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
              activeDot={{ fill: '#22C55E', stroke: '#fff', strokeWidth: 2, r: 4 }}
            />

            {/* Gradient definition for TSB area */}
            <defs>
              <linearGradient id="tsbGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22C55E" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#22C55E" stopOpacity={0} />
                <stop offset="50%" stopColor="#EF4444" stopOpacity={0} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0.3} />
              </linearGradient>
            </defs>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-white/[0.04]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-blade-blue rounded-full" />
          <span className="text-[10px] text-text-muted">Fitness (CTL)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-[#D96570] rounded-full" />
          <span className="text-[10px] text-text-muted">Fatigue (ATL)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-success rounded-full" style={{ background: 'repeating-linear-gradient(90deg, #22C55E 0, #22C55E 4px, transparent 4px, transparent 6px)' }} />
          <span className="text-[10px] text-text-muted">Form (TSB)</span>
        </div>
      </div>
    </div>
  );
}

export default PMCChart;
