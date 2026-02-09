/**
 * CanvasDashboard - Dashboard for The Canvas prototype
 *
 * Design philosophy (from landing page):
 * - Solid surfaces with hard borders, NOT frosted glass
 * - Data numbers are the ONLY chromatic elements
 * - Chrome is monochrome (inkwell palette)
 * - Subtle micro-animations that feel purposeful
 * - Strong contrast between surface layers
 *
 * This is a DESIGN PROTOTYPE — uses demo data for visual impact.
 */

import { useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  ChevronRight,
  Waves,
  Calendar,
  Award,
  Activity,
  ArrowUpRight,
} from 'lucide-react';

// ============================================
// DEMO DATA — prototype visual content
// ============================================

const METRICS = [
  {
    id: 'athletes',
    label: 'Active Athletes',
    value: 24,
    suffix: '',
    icon: Users,
    sparkData: [18, 19, 20, 22, 21, 23, 24],
    dataColor: 'var(--data-good)',
    trend: { value: '+3', up: true },
  },
  {
    id: 'attendance',
    label: 'Attendance',
    value: 91,
    suffix: '%',
    icon: Activity,
    sparkData: [85, 87, 88, 90, 89, 92, 91],
    dataColor: 'var(--data-excellent)',
    trend: { value: '+3%', up: true },
  },
  {
    id: 'split',
    label: 'Avg 2k Split',
    value: '1:48.3',
    suffix: '',
    icon: Waves,
    sparkData: [110, 109, 108.5, 109, 108, 107.5, 108.3],
    dataColor: 'var(--data-good)',
    trend: { value: '-1.2s', up: true },
  },
  {
    id: 'prs',
    label: 'PRs This Week',
    value: 5,
    suffix: '',
    icon: Award,
    sparkData: [1, 2, 1, 3, 2, 4, 5],
    dataColor: 'var(--data-warning)',
    trend: { value: '+2', up: true },
  },
] as const;

const RECENT_ACTIVITY = [
  {
    id: 1,
    athlete: 'Sarah K.',
    action: 'PR on 2k',
    value: '7:12.4',
    time: '2h ago',
    positive: true,
  },
  {
    id: 2,
    athlete: 'Mike T.',
    action: 'Completed 6k test',
    value: '22:48.1',
    time: '3h ago',
    positive: true,
  },
  {
    id: 3,
    athlete: 'Emma R.',
    action: 'Attendance streak',
    value: '14 days',
    time: '5h ago',
    positive: true,
  },
  {
    id: 4,
    athlete: 'Jake L.',
    action: 'Split improvement',
    value: '-1.2s',
    time: '1d ago',
    positive: true,
  },
  {
    id: 5,
    athlete: 'Lily M.',
    action: 'Missed practice',
    value: '—',
    time: '1d ago',
    positive: false,
  },
];

const UPCOMING = [
  { id: 1, title: 'Morning Row', time: 'Tomorrow 6:00 AM', athletes: 18, type: 'On Water' },
  { id: 2, title: '2k Test Day', time: 'Wed 3:30 PM', athletes: 24, type: 'Erg' },
  { id: 3, title: 'Race Prep', time: 'Fri 7:00 AM', athletes: 12, type: 'On Water' },
];

// ============================================
// ANIMATED NUMBER — counts up on mount
// ============================================

function AnimatedNumber({ value, duration = 1.2 }: { value: number | string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const numValue = typeof value === 'number' ? value : parseFloat(value.replace(':', ''));
  const isTime = typeof value === 'string' && value.includes(':');

  useEffect(() => {
    if (!ref.current) return;
    if (isTime) {
      // For time values, just set directly
      ref.current.textContent = String(value);
      return;
    }
    const controls = animate(0, numValue, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        if (ref.current) {
          ref.current.textContent = Number.isInteger(numValue)
            ? Math.round(latest).toString()
            : latest.toFixed(1);
        }
      },
    });
    return () => controls.stop();
  }, [numValue, duration, isTime, value]);

  return <span ref={ref}>{String(value)}</span>;
}

// ============================================
// SPARKLINE — clean, no fill, just the line
// ============================================

function Sparkline({
  data,
  color,
  width = 72,
  height = 28,
}: {
  data: readonly number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = padding + (height - padding * 2) - ((v - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  // End dot position
  const lastX = width;
  const lastY =
    padding +
    (height - padding * 2) -
    ((data[data.length - 1] - min) / range) * (height - padding * 2);

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.6}
      />
      {/* End dot — the current value */}
      <circle cx={lastX} cy={lastY} r={2.5} fill={color} />
    </svg>
  );
}

// ============================================
// STAGGER ANIMATION HELPERS
// ============================================

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
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
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* ============================================ */}
      {/* HERO — tight, contrasty, no fluff */}
      {/* ============================================ */}
      <motion.div variants={fadeUp} className="pt-2 pb-4 border-b border-ink-border">
        <p className="text-xs font-medium text-ink-muted uppercase tracking-[0.15em] mb-1">
          {greeting}
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-ink-bright tracking-tight leading-[1.1]">
          Dashboard
        </h1>
      </motion.div>

      {/* ============================================ */}
      {/* METRICS — solid cards, data-colored numbers */}
      {/* ============================================ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {METRICS.map((m) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.id}
              className="bg-ink-raised border border-ink-border rounded-lg p-4
                         hover:border-ink-border-strong transition-colors duration-150 group"
              whileHover={{ y: -1 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              {/* Label row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Icon size={13} className="text-ink-muted" />
                  <span className="text-[11px] font-medium text-ink-tertiary uppercase tracking-wider">
                    {m.label}
                  </span>
                </div>
                <Sparkline data={m.sparkData} color={m.dataColor} />
              </div>

              {/* Value — data-colored, the ONLY chromatic element */}
              <div className="flex items-baseline gap-1">
                <span
                  className="text-3xl lg:text-4xl font-mono font-bold tracking-tighter leading-none"
                  style={{ color: m.dataColor }}
                >
                  <AnimatedNumber value={m.value} />
                </span>
                {m.suffix && (
                  <span className="text-lg font-mono text-ink-secondary">{m.suffix}</span>
                )}
              </div>

              {/* Trend */}
              <div className="flex items-center gap-1 mt-2">
                {m.trend.up ? (
                  <TrendingUp size={11} className="text-ink-secondary" />
                ) : (
                  <TrendingDown size={11} className="text-ink-secondary" />
                )}
                <span className="text-[11px] text-ink-secondary">{m.trend.value}</span>
                <span className="text-[11px] text-ink-muted">vs last week</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ============================================ */}
      {/* TWO-COLUMN: Activity + Upcoming */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* Recent Activity */}
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <div className="bg-ink-raised border border-ink-border rounded-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-border">
              <h3 className="text-sm font-semibold text-ink-primary">Recent Activity</h3>
              <button className="flex items-center gap-1 text-xs text-ink-tertiary hover:text-ink-primary transition-colors duration-150">
                View all <ArrowUpRight size={11} />
              </button>
            </div>

            <div>
              {RECENT_ACTIVITY.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.3 }}
                  className="flex items-center gap-3 px-5 py-3
                             border-b border-ink-border last:border-b-0
                             hover:bg-ink-hover transition-colors duration-100 cursor-pointer"
                >
                  {/* Initials */}
                  <div
                    className="w-8 h-8 rounded-md bg-ink-base border border-ink-border
                                  flex items-center justify-center text-[11px] font-semibold text-ink-secondary"
                  >
                    {item.athlete
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink-primary">{item.athlete}</span>
                      <span className="text-xs text-ink-muted">{item.action}</span>
                    </div>
                    <span className="text-[11px] text-ink-muted">{item.time}</span>
                  </div>

                  {/* Value — data-colored */}
                  <span
                    className="text-sm font-mono font-semibold"
                    style={{
                      color: item.positive ? 'var(--data-excellent)' : 'var(--data-poor)',
                    }}
                  >
                    {item.value}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Upcoming Sessions */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <div className="bg-ink-raised border border-ink-border rounded-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-border">
              <h3 className="text-sm font-semibold text-ink-primary">Upcoming</h3>
              <button className="flex items-center gap-1 text-xs text-ink-tertiary hover:text-ink-primary transition-colors duration-150">
                Schedule <ArrowUpRight size={11} />
              </button>
            </div>

            <div>
              {UPCOMING.map((session, i) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 + i * 0.08, duration: 0.3 }}
                  className="px-5 py-4 border-b border-ink-border last:border-b-0
                             hover:bg-ink-hover transition-colors duration-100 cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-ink-bright group-hover:text-white transition-colors duration-100">
                        {session.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={11} className="text-ink-muted" />
                        <span className="text-xs text-ink-secondary">{session.time}</span>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded
                                     bg-ink-base text-ink-secondary border border-ink-border"
                    >
                      {session.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <Users size={11} className="text-ink-muted" />
                    <span className="text-xs text-ink-tertiary">{session.athletes} athletes</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ============================================ */}
      {/* BOTTOM BAR — architectural divider, like landing metrics section */}
      {/* ============================================ */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-0 rounded-lg border border-ink-border overflow-hidden bg-ink-raised">
          <BottomStat label="Team Power" value="High" />
          <div className="w-px self-stretch bg-ink-border" />
          <BottomStat label="Next Race" value="12 days" />
          <div className="w-px self-stretch bg-ink-border" />
          <BottomStat label="Trend" value="Improving" />
          <div className="w-px self-stretch bg-ink-border" />
          <BottomStat label="Ranking" value="#4" />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// BOTTOM STAT — clean cell in the bottom bar
// ============================================

function BottomStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 text-center py-3.5 px-4 hover:bg-ink-hover transition-colors duration-100">
      <p className="text-[10px] text-ink-muted uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-ink-primary">{value}</p>
    </div>
  );
}

export default CanvasDashboard;
