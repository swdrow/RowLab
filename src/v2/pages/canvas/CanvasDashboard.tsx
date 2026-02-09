/**
 * CanvasDashboard - Redesigned dashboard for The Canvas prototype
 *
 * No hero header, no card boxes — data floats in the canvas.
 * Large-format numbers, spatial depth, glass treatments.
 * Zone: Home (warm amber ambient glow).
 *
 * This is a DESIGN PROTOTYPE — uses demo data for visual impact.
 *
 * Design: design/canvas branch prototype
 */

import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Zap,
  ChevronRight,
  Waves,
  Calendar,
  Award,
  Activity,
} from 'lucide-react';

// ============================================
// DEMO DATA — prototype visual content
// ============================================

const METRICS = {
  activeAthletes: 24,
  attendanceRate: 91,
  avgSplit: '1:48.3',
  upcomingSessions: 3,
  prsThisWeek: 5,
  teamRank: 4,
};

const RECENT_ACTIVITY = [
  {
    id: 1,
    athlete: 'Sarah K.',
    action: 'PR on 2k',
    value: '7:12.4',
    time: '2h ago',
    trend: 'up' as const,
  },
  {
    id: 2,
    athlete: 'Mike T.',
    action: 'Completed 6k test',
    value: '22:48.1',
    time: '3h ago',
    trend: 'up' as const,
  },
  {
    id: 3,
    athlete: 'Emma R.',
    action: 'Attendance streak',
    value: '14 days',
    time: '5h ago',
    trend: 'up' as const,
  },
  {
    id: 4,
    athlete: 'Jake L.',
    action: 'Split improvement',
    value: '-1.2s',
    time: '1d ago',
    trend: 'up' as const,
  },
];

const UPCOMING = [
  { id: 1, title: 'Morning Row', time: 'Tomorrow 6:00 AM', athletes: 18, type: 'On Water' },
  { id: 2, title: '2k Test Day', time: 'Wed 3:30 PM', athletes: 24, type: 'Erg' },
  { id: 3, title: 'Race Prep', time: 'Fri 7:00 AM', athletes: 12, type: 'On Water' },
];

// ============================================
// SPARKLINE COMPONENT
// ============================================

function Sparkline({
  data,
  color,
  width = 80,
  height = 24,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="inline-block">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Area fill */}
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#spark-${color.replace('#', '')})`}
      />
    </svg>
  );
}

// ============================================
// STAGGER ANIMATION HELPERS
// ============================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

// ============================================
// CANVAS DASHBOARD
// ============================================

export function CanvasDashboard() {
  const now = new Date();
  const greeting =
    now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* ============================================ */}
      {/* HERO GREETING — large, editorial feel */}
      {/* ============================================ */}
      <motion.div variants={itemVariants} className="pt-4">
        <p className="text-sm font-medium text-ink-tertiary uppercase tracking-[0.2em] mb-2">
          {greeting}
        </p>
        <h1 className="text-5xl sm:text-6xl font-semibold text-ink-bright tracking-tight leading-[1.05]">
          Your Team
          <br />
          <span className="text-ink-secondary font-normal">at a Glance</span>
        </h1>
      </motion.div>

      {/* ============================================ */}
      {/* PRIMARY METRICS — floating large-format numbers */}
      {/* ============================================ */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
      >
        {/* Active Athletes */}
        <MetricFloat
          label="Active Athletes"
          value={METRICS.activeAthletes.toString()}
          suffix=""
          icon={<Users size={16} />}
          sparkData={[18, 19, 20, 22, 21, 23, 24]}
          sparkColor="#FBBF24"
          accent="amber"
        />

        {/* Attendance Rate */}
        <MetricFloat
          label="Attendance"
          value={METRICS.attendanceRate.toString()}
          suffix="%"
          icon={<Activity size={16} />}
          sparkData={[85, 87, 88, 90, 89, 92, 91]}
          sparkColor="#14B8A6"
          accent="teal"
          trend="+3%"
          trendUp
        />

        {/* Average Split */}
        <MetricFloat
          label="Avg 2k Split"
          value={METRICS.avgSplit}
          icon={<Waves size={16} />}
          sparkData={[110, 109, 108.5, 109, 108, 107.5, 108.3]}
          sparkColor="#818CF8"
          accent="indigo"
          trend="-1.2s"
          trendUp
        />

        {/* PRs This Week */}
        <MetricFloat
          label="PRs This Week"
          value={METRICS.prsThisWeek.toString()}
          icon={<Award size={16} />}
          sparkData={[1, 2, 1, 3, 2, 4, 5]}
          sparkColor="#F87171"
          accent="red"
          trend="+2"
          trendUp
        />
      </motion.div>

      {/* ============================================ */}
      {/* TWO-COLUMN LAYOUT: Activity + Upcoming */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Activity — wider */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-ink-primary">Recent Activity</h3>
              <button className="flex items-center gap-1 text-xs text-ink-tertiary hover:text-ink-primary transition-colors">
                View all <ChevronRight size={12} />
              </button>
            </div>

            <div className="space-y-1">
              {RECENT_ACTIVITY.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-4 py-3 px-3 -mx-3 rounded-xl
                             hover:bg-white/[0.03] transition-colors duration-150 group cursor-pointer"
                >
                  {/* Avatar placeholder */}
                  <div
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-white/[0.08] to-white/[0.02]
                                  border border-white/[0.06] flex items-center justify-center
                                  text-xs font-semibold text-ink-secondary"
                  >
                    {item.athlete
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink-primary">{item.athlete}</span>
                      <span className="text-xs text-ink-tertiary">{item.action}</span>
                    </div>
                    <span className="text-xs text-ink-muted">{item.time}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-semibold text-ink-bright">
                      {item.value}
                    </span>
                    {item.trend === 'up' && <TrendingUp size={14} className="text-emerald-400" />}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Upcoming Sessions — narrower */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-ink-primary">Upcoming</h3>
              <button className="flex items-center gap-1 text-xs text-ink-tertiary hover:text-ink-primary transition-colors">
                Schedule <ChevronRight size={12} />
              </button>
            </div>

            <div className="space-y-3">
              {UPCOMING.map((session, i) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="p-4 rounded-xl
                             bg-white/[0.02] border border-white/[0.04]
                             hover:bg-white/[0.04] hover:border-white/[0.08]
                             transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-ink-bright group-hover:text-white transition-colors">
                        {session.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={12} className="text-ink-muted" />
                        <span className="text-xs text-ink-secondary">{session.time}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded
                        ${
                          session.type === 'On Water'
                            ? 'bg-ink-raised text-ink-secondary border border-ink-border'
                            : 'bg-ink-raised text-ink-secondary border border-ink-border'
                        }`}
                    >
                      {session.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3">
                    <Users size={12} className="text-ink-muted" />
                    <span className="text-xs text-ink-tertiary">{session.athletes} athletes</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ============================================ */}
      {/* BOTTOM ROW: Quick Stats Band */}
      {/* ============================================ */}
      <motion.div variants={itemVariants}>
        <div
          className="flex items-center gap-6 py-4 px-6 rounded-2xl
                        bg-white/[0.02] border border-white/[0.04]"
        >
          <StatPill icon={<Zap size={14} />} label="Team Power" value="High" color="#FBBF24" />
          <div className="w-px h-6 bg-white/[0.06]" />
          <StatPill
            icon={<Calendar size={14} />}
            label="Next Race"
            value="12 days"
            color="#F87171"
          />
          <div className="w-px h-6 bg-white/[0.06]" />
          <StatPill
            icon={<TrendingUp size={14} />}
            label="Trend"
            value="Improving"
            color="#14B8A6"
          />
          <div className="w-px h-6 bg-white/[0.06]" />
          <StatPill
            icon={<Award size={14} />}
            label="Ranking"
            value={`#${METRICS.teamRank}`}
            color="#818CF8"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// METRIC FLOAT — large-format number, not in a box
// ============================================

interface MetricFloatProps {
  label: string;
  value: string;
  suffix?: string;
  icon: React.ReactNode;
  sparkData: number[];
  sparkColor: string;
  accent: string;
  trend?: string;
  trendUp?: boolean;
}

function MetricFloat({
  label,
  value,
  suffix,
  icon,
  sparkData,
  sparkColor,
  trend,
  trendUp,
}: MetricFloatProps) {
  return (
    <div className="glass-panel p-5 group cursor-default">
      {/* Top row: icon + label */}
      <div className="flex items-center gap-2 mb-3">
        <div className="text-ink-muted">{icon}</div>
        <span className="text-xs font-medium text-ink-tertiary uppercase tracking-wider">
          {label}
        </span>
      </div>

      {/* Large number + sparkline */}
      <div className="flex items-end justify-between">
        <div>
          <span className="text-4xl lg:text-5xl font-metric font-bold text-ink-bright tracking-tighter leading-none">
            {value}
          </span>
          {suffix && (
            <span className="text-2xl lg:text-3xl font-metric text-ink-secondary ml-0.5">
              {suffix}
            </span>
          )}
        </div>
        <div className="pb-2">
          <Sparkline data={sparkData} color={sparkColor} />
        </div>
      </div>

      {/* Trend */}
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          {trendUp ? (
            <TrendingUp size={12} className="text-emerald-400" />
          ) : (
            <TrendingDown size={12} className="text-red-400" />
          )}
          <span className={`text-xs font-medium ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend}
          </span>
          <span className="text-xs text-ink-muted ml-1">vs last week</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// STAT PILL — inline stat for the bottom band
// ============================================

function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div style={{ color }} className="opacity-70">
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-ink-muted uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-ink-primary">{value}</p>
      </div>
    </div>
  );
}

// ============================================
// GLOBAL STYLES for glass-panel (injected once)
// ============================================

const glassPanelStyles = `
.glass-panel {
  background: rgba(255, 255, 255, 0.025);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.03),
    0 2px 8px rgba(0, 0, 0, 0.2),
    0 8px 32px rgba(0, 0, 0, 0.15);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.glass-panel:hover {
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.05),
    0 4px 12px rgba(0, 0, 0, 0.25),
    0 12px 40px rgba(0, 0, 0, 0.2);
}
`;

if (typeof document !== 'undefined' && !document.getElementById('canvas-glass-panel-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'canvas-glass-panel-styles';
  styleSheet.textContent = glassPanelStyles;
  document.head.appendChild(styleSheet);
}

export default CanvasDashboard;
