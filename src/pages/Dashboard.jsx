import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Ship,
  ArrowRight,
  BarChart3,
  Dumbbell,
  Anchor,
} from 'lucide-react';
import useLineupStore from '../store/lineupStore';
import useAuthStore from '../store/authStore';

function Dashboard() {
  const { athletes, activeBoats, boatConfigs, shells } = useLineupStore();
  const { user } = useAuthStore();

  const assignedAthletes = activeBoats.reduce((count, boat) => {
    return count + boat.seats.filter(s => s.athlete).length + (boat.coxswain ? 1 : 0);
  }, 0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const stats = [
    { label: 'Athletes', value: athletes.length, icon: Users, to: '/app/athletes' },
    { label: 'Active Boats', value: activeBoats.length, icon: Ship, to: '/app/lineup' },
    { label: 'Assigned', value: assignedAthletes, icon: Anchor },
    { label: 'Boat Configs', value: boatConfigs.length, icon: Ship },
  ];

  const quickActions = [
    { label: 'Build Lineup', desc: 'Create boat assignments', icon: Anchor, to: '/app/lineup' },
    { label: 'Athletes', desc: 'Manage your roster', icon: Users, to: '/app/athletes' },
    { label: 'Erg Data', desc: 'View erg results', icon: Dumbbell, to: '/app/erg' },
    { label: 'Analytics', desc: 'Performance insights', icon: BarChart3, to: '/app/analytics' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8"
      >
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)] mb-1">
          {getGreeting()}{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-secondary)]">
          Here's your team overview.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          const content = (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-3 sm:p-4 hover:border-[var(--accent-subtle)] transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center">
                  <Icon size={16} className="sm:w-[18px] sm:h-[18px] text-[var(--accent)]" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)]">{stat.value}</div>
              <div className="text-xs sm:text-sm text-[var(--text-secondary)]">{stat.label}</div>
            </motion.div>
          );
          return stat.to ? <Link key={stat.label} to={stat.to}>{content}</Link> : <div key={stat.label}>{content}</div>;
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 gap-2 sm:gap-3">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} to={action.to}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="card p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:border-[var(--accent-subtle)] transition-colors group"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center group-hover:bg-[var(--accent)] transition-colors flex-shrink-0">
                    <Icon size={18} className="sm:w-5 sm:h-5 text-[var(--accent)] group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-base text-[var(--text-primary)]">{action.label}</div>
                    <div className="text-xs sm:text-sm text-[var(--text-secondary)] truncate">{action.desc}</div>
                  </div>
                  <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px] text-[var(--text-muted)] group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all flex-shrink-0" />
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Team Summary */}
      <div className="card p-4 sm:p-5">
        <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-3 sm:mb-4">Team Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <div className="text-xs sm:text-sm text-[var(--text-secondary)] mb-1">Port Rowers</div>
            <div className="text-lg sm:text-xl font-semibold text-[var(--port)]">
              {athletes.filter(a => a.side === 'P' || a.side === 'B').length}
            </div>
          </div>
          <div>
            <div className="text-xs sm:text-sm text-[var(--text-secondary)] mb-1">Starboard</div>
            <div className="text-lg sm:text-xl font-semibold text-[var(--starboard)]">
              {athletes.filter(a => a.side === 'S' || a.side === 'B').length}
            </div>
          </div>
          <div>
            <div className="text-xs sm:text-sm text-[var(--text-secondary)] mb-1">Coxswains</div>
            <div className="text-lg sm:text-xl font-semibold text-[var(--coxswain)]">
              {athletes.filter(a => a.side === 'Cox').length}
            </div>
          </div>
          <div>
            <div className="text-xs sm:text-sm text-[var(--text-secondary)] mb-1">Shells</div>
            <div className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">
              {shells.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
