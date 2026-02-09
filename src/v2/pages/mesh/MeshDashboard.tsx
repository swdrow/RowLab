/**
 * MeshDashboard - Gradient Mesh prototype dashboard showcase
 *
 * A visually stunning dashboard that demonstrates the Gradient Mesh design
 * direction. Features frosted glass panels over an animated mesh gradient,
 * bold gradient typography, color-rich metric cards, and staggered
 * Framer Motion entrance animations.
 *
 * Sections:
 * 1. Hero — Full-width gradient header with greeting + key stat
 * 2. Metric Cards — 4-column grid with colored accent borders and sparklines
 * 3. Activity Feed — Recent team activity in a glass panel
 * 4. Upcoming Sessions — Next training sessions list
 * 5. Quick Actions — Gradient-background action buttons
 *
 * All data is demo/placeholder — clearly marked with comments.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  Gauge,
  Trophy,
  Calendar,
  ChevronRight,
  Plus,
  Zap,
  Target,
  ArrowUpRight,
  Waves,
} from 'lucide-react';
import { useAuth } from '@v2/contexts/AuthContext';

// ============================================
// ANIMATION VARIANTS
// ============================================

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

// ============================================
// HELPERS
// ============================================

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Late night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Late night';
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// ============================================
// DEMO DATA — clearly marked, not production
// ============================================

/** Demo metric cards data */
const DEMO_METRICS = [
  {
    label: 'Active Athletes',
    value: '24',
    change: '+3',
    trend: 'up' as const,
    icon: Users,
    accentColor: '#14b8a6', // teal
    sparkline: [18, 20, 19, 22, 21, 23, 24],
  },
  {
    label: 'Avg 2k Split',
    value: '7:12.4',
    change: '-2.1s',
    trend: 'up' as const,
    icon: Gauge,
    accentColor: '#818cf8', // indigo
    sparkline: [7.3, 7.28, 7.25, 7.22, 7.2, 7.18, 7.12],
  },
  {
    label: 'Weekly Sessions',
    value: '12',
    change: '+2',
    trend: 'up' as const,
    icon: Calendar,
    accentColor: '#fbbf24', // amber
    sparkline: [8, 9, 10, 9, 11, 10, 12],
  },
  {
    label: 'Team Rating',
    value: '94.2',
    change: '+1.8',
    trend: 'up' as const,
    icon: Trophy,
    accentColor: '#fb7185', // coral
    sparkline: [89, 90, 91, 92, 91, 93, 94.2],
  },
];

/** Demo activity feed */
const DEMO_ACTIVITY = [
  {
    id: 1,
    user: 'Sarah Chen',
    action: 'completed a 2k test',
    detail: '7:04.2 — new PR',
    time: '12 min ago',
    color: '#14b8a6',
  },
  {
    id: 2,
    user: 'Marcus Johnson',
    action: 'logged attendance',
    detail: '22/24 present',
    time: '45 min ago',
    color: '#818cf8',
  },
  {
    id: 3,
    user: 'Coach Williams',
    action: 'created a lineup',
    detail: 'Varsity 8+ — Head of the Charles',
    time: '2 hrs ago',
    color: '#fbbf24',
  },
  {
    id: 4,
    user: 'Emma Rodriguez',
    action: 'set a new 6k PR',
    detail: '21:38.5',
    time: '3 hrs ago',
    color: '#fb7185',
  },
  {
    id: 5,
    user: 'Alex Kim',
    action: 'updated availability',
    detail: 'Available Mon-Fri this week',
    time: '5 hrs ago',
    color: '#60a5fa',
  },
];

/** Demo upcoming sessions */
const DEMO_SESSIONS = [
  {
    id: 1,
    title: 'Morning Water Session',
    time: 'Tomorrow, 5:45 AM',
    type: 'On-Water',
    athletes: 16,
    color: '#14b8a6',
  },
  {
    id: 2,
    title: 'Erg Interval Training',
    time: 'Tomorrow, 3:00 PM',
    type: 'Indoor',
    athletes: 24,
    color: '#818cf8',
  },
  {
    id: 3,
    title: 'Seat Race Series #4',
    time: 'Wednesday, 6:00 AM',
    type: 'On-Water',
    athletes: 8,
    color: '#fb7185',
  },
];

/** Demo quick actions */
const DEMO_ACTIONS = [
  {
    label: 'New Session',
    icon: Plus,
    gradient: 'from-teal-500 to-cyan-500',
  },
  {
    label: 'Run Erg Test',
    icon: Zap,
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    label: 'Build Lineup',
    icon: Target,
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    label: 'View Reports',
    icon: ArrowUpRight,
    gradient: 'from-rose-500 to-pink-500',
  },
];

// ============================================
// MINI SPARKLINE COMPONENT
// ============================================

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const width = 80;
  const height = 28;
  const padding = 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  // Create area fill path
  const areaD = `${pathD} L ${width - padding},${height} L ${padding},${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      {/* Gradient fill under line */}
      <defs>
        <linearGradient id={`spark-fill-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.20" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#spark-fill-${color.replace('#', '')})`} />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={parseFloat(points[points.length - 1]?.split(',')[0] ?? '0')}
        cy={parseFloat(points[points.length - 1]?.split(',')[1] ?? '0')}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

export function MeshDashboard() {
  const { user } = useAuth();
  const greeting = useMemo(() => getGreeting(), []);
  const formattedDate = useMemo(() => getFormattedDate(), []);
  const firstName = user?.name?.split(' ')[0] || 'Coach';

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* ============================================
          SECTION 1: HERO HEADER
          Full-width gradient header area with greeting and key stat
          ============================================ */}
      <motion.div variants={fadeUp}>
        <div className="mesh-glass rounded-2xl p-8 lg:p-10 relative overflow-hidden">
          {/* Subtle inner gradient wash */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 20% 30%, rgba(99, 102, 241, 0.08) 0%, transparent 60%)',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 80% 70%, rgba(20, 184, 166, 0.06) 0%, transparent 50%)',
            }}
          />

          <div className="relative z-10 flex items-end justify-between">
            <div>
              {/* Date */}
              <p className="text-white/35 text-[13px] font-mono tracking-wide mb-2">
                {formattedDate}
              </p>

              {/* Greeting — large gradient text */}
              <h1 className="text-3xl lg:text-4xl font-display font-bold tracking-tight">
                <span className="mesh-gradient-text">
                  {greeting}, {firstName}
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-white/45 mt-2 text-[15px]">
                Your team is performing well. Here is your overview.
              </p>
            </div>

            {/* Hero stat — demo data */}
            <div className="hidden lg:block text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <Waves className="w-5 h-5 text-teal-400" />
                <span className="text-white/40 text-[13px] font-mono">Season Progress</span>
              </div>
              <p className="text-5xl font-metric font-bold text-white/90 tracking-tight">
                78<span className="text-2xl text-white/40">%</span>
              </p>
              <p className="text-white/30 text-[12px] mt-1">12 of 16 weeks completed</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============================================
          SECTION 2: METRIC CARDS
          4-column grid, each card has colored top accent border
          ============================================ */}
      <motion.div
        variants={fadeIn}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {DEMO_METRICS.map((metric, index) => (
          <motion.div key={metric.label} variants={scaleIn} custom={index}>
            <MetricCard metric={metric} />
          </motion.div>
        ))}
      </motion.div>

      {/* ============================================
          SECTION 3 & 4: ACTIVITY + SESSIONS (2-column)
          ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Activity Feed — takes 3 columns */}
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <div className="mesh-glass rounded-2xl p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-semibold text-white/80 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                Recent Activity
              </h2>
              <button className="text-[12px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-1">
              {DEMO_ACTIVITY.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-start gap-3 py-3 border-b border-white/[0.04] last:border-0
                             group hover:bg-white/[0.02] rounded-lg px-2 -mx-2 transition-colors"
                >
                  {/* Color dot */}
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}40` }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white/70">
                      <span className="text-white/90 font-medium">{item.user}</span> {item.action}
                    </p>
                    <p className="text-[12px] text-white/35 mt-0.5">{item.detail}</p>
                  </div>
                  <span className="text-[11px] text-white/25 font-mono shrink-0 mt-0.5">
                    {item.time}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Upcoming Sessions — takes 2 columns */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <div className="mesh-glass rounded-2xl p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-semibold text-white/80 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Upcoming Sessions
              </h2>
              <button className="text-[12px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-1">
                Schedule <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {DEMO_SESSIONS.map((session, i) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.08, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="mesh-glass-subtle rounded-xl p-4 group hover:bg-white/[0.04]
                             transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[13px] text-white/80 font-medium">{session.title}</p>
                      <p className="text-[12px] text-white/35 mt-1">{session.time}</p>
                    </div>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${session.color}15`,
                        color: session.color,
                        border: `1px solid ${session.color}30`,
                      }}
                    >
                      {session.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <Users className="w-3 h-3 text-white/25" />
                    <span className="text-[11px] text-white/30">{session.athletes} athletes</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ============================================
          SECTION 5: QUICK ACTIONS
          Gradient-background action buttons
          ============================================ */}
      <motion.div variants={fadeUp}>
        <div className="mesh-glass rounded-2xl p-6">
          <h2 className="text-[15px] font-semibold text-white/80 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Quick Actions
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DEMO_ACTIONS.map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    relative overflow-hidden rounded-xl p-4 text-left
                    bg-gradient-to-br ${action.gradient}
                    shadow-lg transition-shadow hover:shadow-xl
                    group cursor-pointer
                  `}
                >
                  {/* Frosted overlay */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

                  <div className="relative z-10">
                    <Icon className="w-5 h-5 text-white/90 mb-3" />
                    <p className="text-[13px] text-white font-semibold">{action.label}</p>
                  </div>

                  {/* Glow effect */}
                  <div
                    className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full
                               bg-white/10 blur-2xl group-hover:bg-white/20 transition-colors"
                  />
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ============================================
          FOOTER: PROTOTYPE LABEL
          ============================================ */}
      <motion.div variants={fadeIn} className="text-center pb-8">
        <p className="text-[11px] text-white/20 font-mono">
          Direction H: The Gradient Mesh — Design Prototype
        </p>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// METRIC CARD SUBCOMPONENT
// ============================================

interface MetricCardProps {
  metric: (typeof DEMO_METRICS)[number];
}

function MetricCard({ metric }: MetricCardProps) {
  const Icon = metric.icon;
  const isUp = metric.trend === 'up';

  return (
    <div
      className="mesh-glass rounded-2xl p-5 relative overflow-hidden group
                 hover:bg-white/[0.06] transition-colors"
    >
      {/* Colored top accent border */}
      <div
        className="absolute top-0 left-4 right-4 h-[2px] rounded-b-full"
        style={{
          backgroundColor: metric.accentColor,
          boxShadow: `0 2px 12px ${metric.accentColor}30`,
        }}
      />

      {/* Header: icon + label */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: metric.accentColor }} />
          <span className="text-[12px] text-white/40 font-mono">{metric.label}</span>
        </div>
      </div>

      {/* Value + Trend */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-metric font-bold text-white/90 tracking-tight">
            {metric.value}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {isUp ? (
              <TrendingUp className="w-3 h-3 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-400" />
            )}
            <span className={`text-[11px] font-mono ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {metric.change}
            </span>
            <span className="text-[10px] text-white/25">vs last week</span>
          </div>
        </div>

        {/* Sparkline */}
        <div className="opacity-70 group-hover:opacity-100 transition-opacity">
          <MiniSparkline data={metric.sparkline} color={metric.accentColor} />
        </div>
      </div>
    </div>
  );
}

export default MeshDashboard;
