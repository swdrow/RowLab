/**
 * CanvasDashboard - Dashboard for The Canvas prototype
 *
 * Every element here is a custom Canvas primitive, not a generic HTML pattern:
 * - Chamfered panels (clip-path diagonal corners, NOT rounded rectangles)
 * - Scramble-in numbers (digits randomize then settle L→R, like instrument boot)
 * - Strip charts (mini bar histograms with progressive opacity, NOT SVG sparklines)
 * - Ruled section headers (label with extending gradient line, NOT card headers)
 * - Log-tape activity (4-column grid with indicator bars, NOT card lists)
 * - Console readout (monospace strip with blinking cursor, NOT a stats bar)
 * - Ticket sessions (chamfered + tilt-on-hover, NOT standard cards)
 *
 * Data is the ONLY chromatic element. All chrome is monochrome inkwell.
 * This is a DESIGN PROTOTYPE — uses demo data for visual impact.
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, Users, Waves, Award, Activity } from 'lucide-react';

// ============================================
// DEMO DATA — prototype visual content
// ============================================

const METRICS = [
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
    value: '\u2014',
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
// SCRAMBLE NUMBER — digits randomize then settle L→R
// Like an instrument display powering on.
// Much more distinctive than a simple count-up.
// ============================================

function ScrambleNumber({ value }: { value: number | string }) {
  const target = String(value);
  const [display, setDisplay] = useState(() =>
    target.replace(/\d/g, () => String(Math.floor(Math.random() * 10)))
  );
  const rafRef = useRef(0);

  useEffect(() => {
    const chars = target.split('');
    const digitIndices: number[] = [];
    chars.forEach((ch, i) => {
      if (/\d/.test(ch)) digitIndices.push(i);
    });

    const INITIAL_DELAY = 8; // frames of pure scramble
    const SETTLE_RATE = 4; // frames between each digit locking in
    let frame = 0;
    let settled = 0;

    const tick = () => {
      frame++;

      if (frame > INITIAL_DELAY && frame % SETTLE_RATE === 0 && settled < digitIndices.length) {
        settled++;
      }

      const result = chars
        .map((ch, i) => {
          if (!/\d/.test(ch)) return ch;
          const pos = digitIndices.indexOf(i);
          if (pos < settled) return ch;
          return String(Math.floor(Math.random() * 10));
        })
        .join('');

      setDisplay(result);

      if (settled >= digitIndices.length) {
        setDisplay(target);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);

  return <span>{display}</span>;
}

// ============================================
// STRIP CHART — mini bar histogram with progressive opacity
// Older data fades, recent data glows. NOT a generic sparkline.
// ============================================

function StripChart({
  data,
  color,
  delay = 0,
}: {
  data: readonly number[];
  color: string;
  delay?: number;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-[2px] h-3 mt-3">
      {data.map((v, i) => {
        const normalized = (v - min) / range;
        const heightPct = 15 + normalized * 85;
        const isLast = i === data.length - 1;
        const opacity = isLast ? 0.85 : 0.12 + (i / (data.length - 1)) * 0.5;

        return (
          <motion.div
            key={i}
            className="flex-1 rounded-[1px]"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: `${heightPct}%`, opacity }}
            transition={{
              delay: delay + i * 0.05,
              duration: 0.5,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{ backgroundColor: color }}
          />
        );
      })}
    </div>
  );
}

// ============================================
// RULED HEADER — label with extending gradient line
// Replaces generic card-with-title pattern.
// ============================================

function RuledHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="canvas-ruled mb-4 mt-2">
      <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-[0.2em] select-none">
        {children}
      </span>
    </div>
  );
}

// ============================================
// STAGGER ANIMATION HELPERS
// ============================================

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

// ============================================
// CANVAS DASHBOARD
// ============================================

export function CanvasDashboard() {
  const now = new Date();
  const greeting =
    now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8">
      {/* ============================================ */}
      {/* HEADER — no wrapper, just text against the void */}
      {/* ============================================ */}
      <motion.div variants={fadeUp} className="flex items-end justify-between pt-2 pb-6">
        <div>
          <p className="text-xs font-medium text-ink-muted uppercase tracking-[0.15em] mb-1">
            {greeting}
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-ink-bright tracking-tight leading-none">
            Dashboard
          </h1>
        </div>
        <span className="text-xs font-mono text-ink-muted tracking-wide">{dateStr}</span>
      </motion.div>

      {/* ============================================ */}
      {/* METRICS — chamfered panels with accent edges */}
      {/* First metric spans 2 cols (featured), rest are 1 each */}
      {/* ============================================ */}
      <motion.div variants={fadeUp}>
        <RuledHeader>Metrics</RuledHeader>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {METRICS.map((m, i) => {
            const Icon = m.icon;
            const isFeatured = i === 0;

            return (
              <motion.div
                key={m.id}
                className={`canvas-chamfer bg-ink-raised relative p-5 group ${isFeatured ? 'col-span-2' : ''}`}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {/* Inner breathing radiance — subtle glow from the accent edge */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse 50% 80% at 0% 50%, ${m.dataColor} 0%, transparent 60%)`,
                  }}
                  animate={{ opacity: [0, 0.04, 0] }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 2,
                  }}
                />

                {/* Left accent edge — breathes slowly, staggered per panel */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-0.5 canvas-accent-breathe"
                  style={{
                    backgroundColor: m.dataColor,
                    animationDelay: `${i * 1.5}s`,
                  }}
                />

                {/* Label row */}
                <div className="flex items-center gap-1.5 mb-3">
                  <Icon size={12} className="text-ink-muted" />
                  <span className="text-[10px] font-medium text-ink-tertiary uppercase tracking-[0.15em]">
                    {m.label}
                  </span>
                </div>

                {/* Value + trend inline */}
                <div className="flex items-baseline gap-2">
                  <span
                    className={`font-extrabold tracking-tight leading-none ${
                      isFeatured ? 'text-4xl lg:text-5xl' : 'text-3xl lg:text-4xl'
                    }`}
                    style={{ color: m.dataColor, fontVariantNumeric: 'tabular-nums' }}
                  >
                    <ScrambleNumber value={m.value} />
                  </span>
                  {m.suffix && (
                    <span className="text-lg font-semibold text-ink-secondary">{m.suffix}</span>
                  )}

                  {/* Trend — pushed to the right */}
                  <div className="flex items-center gap-1 ml-auto">
                    {m.trend.up ? (
                      <TrendingUp size={11} className="text-ink-secondary" />
                    ) : (
                      <TrendingDown size={11} className="text-ink-secondary" />
                    )}
                    <span className="text-[11px] font-mono text-ink-secondary">
                      {m.trend.value}
                    </span>
                  </div>
                </div>

                {/* Strip chart — bars grow in sequentially */}
                <StripChart data={m.sparkData} color={m.dataColor} delay={0.6 + i * 0.15} />
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ============================================ */}
      {/* TWO-COLUMN: Activity log + Upcoming tickets */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* ACTIVITY — log tape entries, NO card wrapper */}
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <RuledHeader>Recent Activity</RuledHeader>
          <div>
            {RECENT_ACTIVITY.map((item, i) => (
              <motion.div
                key={item.id}
                className="canvas-log-entry"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.3 + i * 0.06,
                  duration: 0.3,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {/* Timestamp column */}
                <span className="text-[11px] font-mono text-ink-muted text-right">{item.time}</span>

                {/* Indicator bar — 3px colored strip, breathes subtly */}
                <div
                  className="self-stretch rounded-full canvas-indicator-breathe"
                  style={{
                    backgroundColor: item.positive ? 'var(--data-good)' : 'var(--data-poor)',
                    animationDelay: `${i * 0.8}s`,
                  }}
                />

                {/* Name + action */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-ink-primary">{item.athlete}</span>
                  <span className="text-xs text-ink-muted truncate">{item.action}</span>
                </div>

                {/* Value — data colored */}
                <span
                  className="text-sm font-mono font-semibold tabular-nums"
                  style={{
                    color: item.positive ? 'var(--data-excellent)' : 'var(--data-poor)',
                  }}
                >
                  {item.value}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* UPCOMING — chamfered tickets that tilt on hover */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <RuledHeader>Upcoming</RuledHeader>
          <div className="space-y-3">
            {UPCOMING.map((session, i) => (
              <motion.div
                key={session.id}
                className="canvas-chamfer canvas-ticket bg-ink-raised relative p-4 group"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.35 + i * 0.08,
                  duration: 0.35,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {/* Top accent line — stops at chamfer cut */}
                <div
                  className="absolute top-0 left-0 h-px"
                  style={{
                    right: '14px',
                    background: 'linear-gradient(to right, rgba(255,255,255,0.06), transparent)',
                  }}
                />

                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-ink-bright group-hover:text-white transition-colors duration-150">
                      {session.title}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Clock size={11} className="text-ink-muted" />
                      <span className="text-xs text-ink-secondary">{session.time}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-ink-secondary">
                    {session.type}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-3">
                  <Users size={11} className="text-ink-muted" />
                  <span className="text-xs text-ink-tertiary">{session.athletes} athletes</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ============================================ */}
      {/* CONSOLE READOUT — monospace strip with blinking cursor */}
      {/* NOT a card, NOT a stats bar — a live instrument readout */}
      {/* ============================================ */}
      <motion.div variants={fadeUp}>
        <div className="canvas-console flex items-center flex-wrap gap-y-2 text-xs py-4 border-t border-ink-border">
          {[
            { label: 'TEAM POWER', value: 'High' },
            { label: 'NEXT RACE', value: '12 days' },
            { label: 'TREND', value: 'Improving' },
            { label: 'RANKING', value: '#4' },
          ].map((pair, i) => (
            <div key={pair.label} className="flex items-center">
              {i > 0 && (
                <span className="text-ink-muted opacity-25 mx-3 select-none">{'\u2502'}</span>
              )}
              <span className="text-ink-muted">{pair.label}</span>
              <span className="text-ink-primary font-medium ml-2">{pair.value}</span>
            </div>
          ))}
          <span className="canvas-cursor text-ink-muted ml-1" />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default CanvasDashboard;
