import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { format, startOfWeek, addWeeks, isBefore, isAfter, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, Activity, Target, CheckCircle2 } from 'lucide-react';

// Intensity factor for TSS calculation
const INTENSITY_FACTORS = {
  easy: 0.6,
  moderate: 0.8,
  hard: 0.95,
  max: 1.0,
};

/**
 * TrainingLoadChart - Visualize planned vs actual training load
 */
function TrainingLoadChart({ plan }) {
  const [viewMode, setViewMode] = useState('weekly'); // weekly, cumulative

  // Calculate weekly training load from planned workouts
  const weeklyData = useMemo(() => {
    if (!plan?.workouts?.length) return [];

    const startDate = plan.startDate ? new Date(plan.startDate) : new Date();
    const endDate = plan.endDate ? new Date(plan.endDate) : addWeeks(startDate, 12);

    // Group workouts by week
    const weekMap = new Map();

    let currentWeek = startOfWeek(startDate, { weekStartsOn: 1 });
    while (isBefore(currentWeek, endDate) || format(currentWeek, 'yyyy-MM-dd') === format(startOfWeek(endDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')) {
      weekMap.set(format(currentWeek, 'yyyy-MM-dd'), {
        weekStart: currentWeek,
        planned: 0,
        actual: 0,
        workouts: 0,
        completed: 0,
      });
      currentWeek = addWeeks(currentWeek, 1);
    }

    // Add planned workouts
    plan.workouts.forEach((workout) => {
      if (!workout.scheduledDate) return;
      const weekStart = format(startOfWeek(new Date(workout.scheduledDate), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      if (weekMap.has(weekStart)) {
        const week = weekMap.get(weekStart);
        week.workouts += 1;
        week.planned += calculateTSS(workout);

        // Count completions
        if (workout.completions?.length > 0) {
          week.completed += 1;
          week.actual += calculateTSS(workout) * (workout.completions[0]?.compliance || 1);
        }
      }
    });

    return Array.from(weekMap.values()).map((week) => ({
      week: format(week.weekStart, 'MMM d'),
      planned: Math.round(week.planned),
      actual: Math.round(week.actual),
      workouts: week.workouts,
      completed: week.completed,
      compliance: week.workouts > 0 ? Math.round((week.completed / week.workouts) * 100) : 0,
    }));
  }, [plan]);

  // Calculate cumulative data
  const cumulativeData = useMemo(() => {
    let plannedTotal = 0;
    let actualTotal = 0;

    return weeklyData.map((week) => {
      plannedTotal += week.planned;
      actualTotal += week.actual;
      return {
        ...week,
        plannedCumulative: plannedTotal,
        actualCumulative: actualTotal,
      };
    });
  }, [weeklyData]);

  // Summary stats
  const stats = useMemo(() => {
    const totalPlanned = weeklyData.reduce((sum, w) => sum + w.planned, 0);
    const totalActual = weeklyData.reduce((sum, w) => sum + w.actual, 0);
    const totalWorkouts = weeklyData.reduce((sum, w) => sum + w.workouts, 0);
    const totalCompleted = weeklyData.reduce((sum, w) => sum + w.completed, 0);

    return {
      totalPlanned: Math.round(totalPlanned),
      totalActual: Math.round(totalActual),
      compliance: totalWorkouts > 0 ? Math.round((totalCompleted / totalWorkouts) * 100) : 0,
      avgWeeklyLoad: weeklyData.length > 0 ? Math.round(totalPlanned / weeklyData.length) : 0,
      totalWorkouts,
      totalCompleted,
    };
  }, [weeklyData]);

  // Calculate TSS for a workout
  function calculateTSS(workout) {
    const factor = INTENSITY_FACTORS[workout.intensity] || 0.7;
    const duration = workout.duration || 2700; // Default 45 min
    const hours = duration / 3600;
    return hours * factor * factor * 100;
  }

  const displayData = viewMode === 'cumulative' ? cumulativeData : weeklyData;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Target}
          label="Total Planned TSS"
          value={stats.totalPlanned}
          color="blade-blue"
        />
        <StatCard
          icon={Activity}
          label="Total Actual TSS"
          value={stats.totalActual}
          color="spectrum-cyan"
          trend={stats.totalActual > stats.totalPlanned * 0.9 ? 'up' : 'down'}
        />
        <StatCard
          icon={CheckCircle2}
          label="Compliance Rate"
          value={`${stats.compliance}%`}
          color={stats.compliance >= 80 ? 'success' : stats.compliance >= 60 ? 'warning-orange' : 'danger-red'}
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Weekly Load"
          value={stats.avgWeeklyLoad}
          color="spectrum-violet"
        />
      </div>

      {/* Chart */}
      <div className="rounded-xl bg-void-surface border border-white/[0.06] p-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-medium text-text-primary">Training Load</h3>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-void-deep border border-white/[0.06] overflow-hidden">
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-3 py-1.5 text-xs font-medium transition-all ${
                  viewMode === 'weekly'
                    ? 'bg-blade-blue/10 text-blade-blue'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setViewMode('cumulative')}
                className={`px-3 py-1.5 text-xs font-medium transition-all ${
                  viewMode === 'cumulative'
                    ? 'bg-blade-blue/10 text-blade-blue'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                Cumulative
              </button>
            </div>
          </div>
        </div>

        {weeklyData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-text-muted">
            <div className="text-center">
              <Activity size={40} className="mx-auto opacity-30 mb-4" />
              <p>No workout data to display</p>
              <p className="text-xs mt-1">Add workouts to the plan to see training load</p>
            </div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="plannedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0070F3" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0070F3" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D9FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00D9FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="week"
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1E',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#E5E7EB' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
                <Area
                  type="monotone"
                  dataKey={viewMode === 'cumulative' ? 'plannedCumulative' : 'planned'}
                  name="Planned TSS"
                  stroke="#0070F3"
                  strokeWidth={2}
                  fill="url(#plannedGradient)"
                />
                <Area
                  type="monotone"
                  dataKey={viewMode === 'cumulative' ? 'actualCumulative' : 'actual'}
                  name="Actual TSS"
                  stroke="#00D9FF"
                  strokeWidth={2}
                  fill="url(#actualGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Compliance Bar Chart */}
      {weeklyData.length > 0 && (
        <div className="rounded-xl bg-void-surface border border-white/[0.06] p-5">
          <h3 className="text-sm font-medium text-text-primary mb-6">Weekly Compliance</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="week"
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  tickLine={false}
                  width={40}
                  domain={[0, 100]}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1E',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#E5E7EB' }}
                  formatter={(value) => [`${value}%`, 'Compliance']}
                />
                <Bar
                  dataKey="compliance"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Workout Breakdown */}
      <div className="rounded-xl bg-void-surface border border-white/[0.06] p-5">
        <h3 className="text-sm font-medium text-text-primary mb-4">Workout Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-void-deep">
            <div className="text-2xl font-semibold text-text-primary">{stats.totalWorkouts}</div>
            <div className="text-xs text-text-muted mt-1">Total Workouts</div>
          </div>
          <div className="p-4 rounded-lg bg-void-deep">
            <div className="text-2xl font-semibold text-success">{stats.totalCompleted}</div>
            <div className="text-xs text-text-muted mt-1">Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, color, trend }) {
  return (
    <div className="p-4 rounded-xl bg-void-surface border border-white/[0.06]">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-${color}/10 border border-${color}/20 flex items-center justify-center`}>
          <Icon size={18} className={`text-${color}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-text-primary">{value}</span>
            {trend && (
              <span className={trend === 'up' ? 'text-success' : 'text-danger-red'}>
                {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              </span>
            )}
          </div>
          <span className="text-xs text-text-muted">{label}</span>
        </div>
      </div>
    </div>
  );
}

export default TrainingLoadChart;
