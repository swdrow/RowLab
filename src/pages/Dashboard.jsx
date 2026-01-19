import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Ship,
  ArrowRight,
  BarChart3,
  Dumbbell,
  Anchor,
  TrendingUp,
  Clock,
} from 'lucide-react';
import useLineupStore from '../store/lineupStore';
import useAuthStore from '../store/authStore';

// ============================================
// SPOTLIGHT CARD - Precision Instrument hover effect
// ============================================
const SpotlightCard = ({ children, className = '', spotlightColor = 'rgba(0, 229, 153, 0.08)' }) => {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        }}
      />
      {/* Inner top light - gradient stroke effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {children}
    </div>
  );
};

// ============================================
// VISUAL ARTIFACTS - Mini data visualizations
// ============================================
const MiniBoatDiagram = () => (
  <div className="flex items-center gap-0.5">
    <div className="w-3 h-4 rounded-sm bg-coxswain-violet/20 border border-coxswain-violet/30" />
    {[8,7,6,5,4,3,2,1].map((n, i) => (
      <div key={n} className={`w-3 h-4 rounded-sm border ${
        i % 2 === 0 ? 'bg-danger-red/15 border-danger-red/30' : 'bg-blade-green/15 border-blade-green/30'
      }`} />
    ))}
  </div>
);

const MiniTrendChart = ({ values = [65, 58, 55, 50, 48, 45] }) => (
  <div className="h-6 flex items-end gap-0.5">
    {values.map((h, i) => (
      <div
        key={i}
        className="flex-1 bg-blade-green/30 rounded-t min-w-[3px]"
        style={{ height: `${h}%` }}
      />
    ))}
  </div>
);

const MiniSplitDisplay = () => (
  <div className="font-mono text-[10px] text-text-muted space-y-0.5">
    <div className="flex justify-between gap-2">
      <span>500m</span>
      <span className="text-blade-green">1:42</span>
    </div>
    <div className="flex justify-between gap-2">
      <span>Avg</span>
      <span className="text-text-primary">1:44</span>
    </div>
  </div>
);

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

  // Stats with visual artifacts
  const stats = [
    {
      label: 'Athletes',
      value: athletes.length,
      icon: Users,
      to: '/app/athletes',
      artifact: <MiniTrendChart values={[40, 45, 52, 50, 53]} />,
    },
    {
      label: 'Active Boats',
      value: activeBoats.length,
      icon: Ship,
      to: '/app/lineup',
      artifact: <MiniBoatDiagram />,
    },
    {
      label: 'Assigned',
      value: assignedAthletes,
      icon: Anchor,
      artifact: null,
    },
    {
      label: 'Shells',
      value: shells.length,
      icon: Ship,
      artifact: null,
    },
  ];

  const quickActions = [
    { label: 'Build Lineup', desc: 'Create boat assignments', icon: Anchor, to: '/app/lineup' },
    { label: 'Athletes', desc: 'Manage your roster', icon: Users, to: '/app/athletes' },
    { label: 'Erg Data', desc: 'View erg results', icon: Dumbbell, to: '/app/erg' },
    { label: 'Analytics', desc: 'Performance insights', icon: BarChart3, to: '/app/analytics' },
  ];

  return (
    <div className="relative p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Background atmosphere - void glow */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blade-green/5 rounded-full blur-3xl pointer-events-none" />

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-primary mb-1 tracking-tight">
          {getGreeting()}{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="text-sm sm:text-base text-text-secondary">
          Here's your team overview.
        </p>
      </motion.div>

      {/* Stats with Spotlight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          const content = (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <SpotlightCard
                className={`
                  h-full rounded-xl
                  bg-void-surface/80 backdrop-blur-sm
                  border border-transparent
                  [background-image:linear-gradient(rgba(12,12,14,0.9),rgba(12,12,14,0.9)),linear-gradient(to_bottom,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]
                  [background-origin:padding-box,border-box]
                  [background-clip:padding-box,border-box]
                  hover:translate-y-[-2px]
                  hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.4)]
                  transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                `}
              >
                <div className="relative p-4 sm:p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blade-green/10 border border-blade-green/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,153,0.15)]">
                      <Icon size={20} className="text-blade-green" />
                    </div>
                    {stat.artifact && (
                      <div className="opacity-60">
                        {stat.artifact}
                      </div>
                    )}
                  </div>
                  <div className="text-3xl sm:text-4xl font-display font-bold text-text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-text-muted">{stat.label}</div>
                </div>
              </SpotlightCard>
            </motion.div>
          );
          return stat.to ? <Link key={stat.label} to={stat.to} className="block">{content}</Link> : <div key={stat.label}>{content}</div>;
        })}
      </div>

      {/* Quick Actions with Spotlight */}
      <div className="mb-8">
        <h2 className="text-lg font-display font-semibold text-text-primary mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} to={action.to}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                >
                  <SpotlightCard
                    className={`
                      rounded-xl group
                      bg-void-surface/80 backdrop-blur-sm
                      border border-transparent
                      [background-image:linear-gradient(rgba(12,12,14,0.9),rgba(12,12,14,0.9)),linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(255,255,255,0.01))]
                      [background-origin:padding-box,border-box]
                      [background-clip:padding-box,border-box]
                      hover:[background-image:linear-gradient(rgba(12,12,14,0.9),rgba(12,12,14,0.9)),linear-gradient(to_bottom,rgba(255,255,255,0.1),rgba(255,255,255,0.03))]
                      transition-all duration-300
                    `}
                  >
                    <div className="p-4 flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-blade-green/10 border border-blade-green/20 flex items-center justify-center group-hover:bg-blade-green group-hover:border-blade-green group-hover:shadow-[0_0_20px_rgba(0,229,153,0.4)] transition-all duration-300 flex-shrink-0">
                        <Icon size={20} className="text-blade-green group-hover:text-void-deep transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-text-primary">{action.label}</div>
                        <div className="text-sm text-text-muted truncate">{action.desc}</div>
                      </div>
                      <ArrowRight size={18} className="text-text-muted group-hover:text-blade-green group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                  </SpotlightCard>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Team Summary with Visual Elements */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <SpotlightCard
          className={`
            rounded-xl
            bg-void-surface/80 backdrop-blur-sm
            border border-transparent
            [background-image:linear-gradient(rgba(12,12,14,0.9),rgba(12,12,14,0.9)),linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(255,255,255,0.01))]
            [background-origin:padding-box,border-box]
            [background-clip:padding-box,border-box]
          `}
        >
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-void-elevated border border-white/[0.06] flex items-center justify-center">
                <Users size={20} className="text-text-secondary" />
              </div>
              <h2 className="text-lg font-display font-semibold text-text-primary">Team Composition</h2>
            </div>

            {/* Visual boat diagram showing team composition */}
            <div className="mb-6 p-4 rounded-xl bg-void-deep/50 border border-white/[0.04]">
              <div className="flex items-center justify-center gap-1 mb-3">
                <div className="w-6 h-8 rounded bg-coxswain-violet/20 border border-coxswain-violet/40 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-coxswain-violet">C</span>
                </div>
                {[8,7,6,5,4,3,2,1].map((n, i) => (
                  <div key={n} className={`w-6 h-8 rounded border flex items-center justify-center ${
                    i % 2 === 0
                      ? 'bg-danger-red/15 border-danger-red/40'
                      : 'bg-blade-green/15 border-blade-green/40'
                  }`}>
                    <span className={`text-[9px] font-bold ${i % 2 === 0 ? 'text-danger-red' : 'text-blade-green'}`}>
                      {n}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-6 text-xs text-text-muted">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-danger-red/30 border border-danger-red/50" />
                  <span>Port</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-blade-green/30 border border-blade-green/50" />
                  <span>Starboard</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-coxswain-violet/30 border border-coxswain-violet/50" />
                  <span>Cox</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-xl bg-danger-red/5 border border-danger-red/10">
                <div className="text-2xl font-display font-bold text-danger-red">
                  {athletes.filter(a => a.side === 'P' || a.side === 'B').length}
                </div>
                <div className="text-xs text-text-muted">Port Rowers</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-blade-green/5 border border-blade-green/10">
                <div className="text-2xl font-display font-bold text-blade-green">
                  {athletes.filter(a => a.side === 'S' || a.side === 'B').length}
                </div>
                <div className="text-xs text-text-muted">Starboard</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-coxswain-violet/5 border border-coxswain-violet/10">
                <div className="text-2xl font-display font-bold text-coxswain-violet">
                  {athletes.filter(a => a.side === 'Cox').length}
                </div>
                <div className="text-xs text-text-muted">Coxswains</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-void-elevated border border-white/[0.06]">
                <div className="text-2xl font-display font-bold text-text-primary">
                  {shells.length}
                </div>
                <div className="text-xs text-text-muted">Shells</div>
              </div>
            </div>
          </div>
        </SpotlightCard>
      </motion.div>
    </div>
  );
}

export default Dashboard;
