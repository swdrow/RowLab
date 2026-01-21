import React from 'react';
import { Users, Ship, Calendar, AlertCircle, TrendingUp, Activity } from 'lucide-react';

/**
 * TeamSummary - Quick health check of team status
 *
 * Displays:
 * - Athletes Active (X/Y)
 * - Boats Configured
 * - Workouts Today
 * - Pending Erg Data
 */
function TeamSummary({
  totalAthletes = 0,
  activeAthletes = 0,
  boatsConfigured = 0,
  workoutsToday = 0,
  pendingErgData = 0,
  className = '',
}) {
  const stats = [
    {
      label: 'Athletes Active',
      value: `${activeAthletes}/${totalAthletes}`,
      icon: Users,
      color: 'blade-blue',
      bgColor: 'bg-blade-blue/10',
      borderColor: 'border-blade-blue/20',
      alert: activeAthletes < totalAthletes * 0.8,
    },
    {
      label: 'Boats Configured',
      value: boatsConfigured,
      icon: Ship,
      color: 'spectrum-violet',
      bgColor: 'bg-spectrum-violet/10',
      borderColor: 'border-spectrum-violet/20',
    },
    {
      label: 'Workouts Today',
      value: workoutsToday,
      icon: Activity,
      color: 'spectrum-cyan',
      bgColor: 'bg-spectrum-cyan/10',
      borderColor: 'border-spectrum-cyan/20',
    },
    {
      label: 'Pending Erg Data',
      value: pendingErgData,
      icon: AlertCircle,
      color: pendingErgData > 0 ? 'warning-orange' : 'text-muted',
      bgColor: pendingErgData > 0 ? 'bg-warning-orange/10' : 'bg-void-surface',
      borderColor: pendingErgData > 0 ? 'border-warning-orange/20' : 'border-white/[0.06]',
      alert: pendingErgData > 0,
    },
  ];

  return (
    <div className={`rounded-xl bg-void-elevated border border-white/[0.06] ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-5 border-b border-white/[0.04]">
        <div className="w-10 h-10 rounded-xl bg-blade-blue/10 border border-blade-blue/20 flex items-center justify-center">
          <TrendingUp size={20} className="text-blade-blue" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-text-primary">Team Summary</h3>
          <p className="text-xs text-text-muted">Quick status overview</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`
                relative p-4 rounded-xl border
                ${stat.bgColor} ${stat.borderColor}
                ${stat.alert ? 'ring-1 ring-warning-orange/30' : ''}
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <Icon size={18} className={`text-${stat.color}`} />
                {stat.alert && (
                  <span className="w-2 h-2 rounded-full bg-warning-orange animate-pulse" />
                )}
              </div>
              <div className={`text-2xl font-mono font-bold text-${stat.color} tabular-nums`}>
                {stat.value}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted mt-1">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TeamSummary;
