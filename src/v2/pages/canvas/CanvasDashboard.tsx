/**
 * CanvasDashboard — Dashboard for The Canvas prototype
 *
 * Design language:
 * - ONE hero metric dominates the viewport (100px+ number)
 * - Mouse-tracking perspective tilt on interactive surfaces
 * - Self-drawing SVG sparkline (dasharray animation)
 * - Clip-path wipe reveals instead of simple fade-ins
 * - Bare editorial timeline (no card wrapper, just dots + line)
 * - Continuous metric strip with hairline dividers
 * - Data numbers are the ONLY chromatic elements
 *
 * This is a DESIGN PROTOTYPE — uses demo data for visual impact.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, animate, useSpring } from 'framer-motion';
import { Users, Waves, Award, Activity, Clock, ArrowRight } from 'lucide-react';

// ============================================
// DEMO DATA
// ============================================

const HERO_METRIC = {
  label: 'Attendance Rate',
  value: 91,
  suffix: '%',
  sparkData: [82, 85, 87, 84, 88, 90, 89, 92, 91, 93, 91],
  dataColor: 'var(--data-excellent)',
  context: 'Last 7 days',
};

const SECONDARY_METRICS = [
  { id: 'athletes', label: 'Athletes', value: '24', dataColor: 'var(--data-good)', icon: Users },
  { id: 'split', label: 'Avg Split', value: '1:48.3', dataColor: 'var(--data-good)', icon: Waves },
  { id: 'prs', label: 'PRs', value: '5', dataColor: 'var(--data-warning)', icon: Award },
  {
    id: 'sessions',
    label: 'This Week',
    value: '12',
    dataColor: 'var(--data-good)',
    icon: Activity,
  },
];

const TIMELINE = [
  {
    id: 1,
    athlete: 'Sarah K.',
    action: 'PR on 2k',
    value: '7:12.4',
    time: '2h ago',
    type: 'pr' as const,
  },
  {
    id: 2,
    athlete: 'Mike T.',
    action: 'Completed 6k',
    value: '22:48.1',
    time: '3h ago',
    type: 'test' as const,
  },
  {
    id: 3,
    athlete: 'Emma R.',
    action: 'Streak: 14 days',
    value: '14d',
    time: '5h ago',
    type: 'streak' as const,
  },
  {
    id: 4,
    athlete: 'Jake L.',
    action: 'Split improvement',
    value: '-1.2s',
    time: '1d',
    type: 'improvement' as const,
  },
  {
    id: 5,
    athlete: 'Lily M.',
    action: 'Missed practice',
    value: '\u2014',
    time: '1d',
    type: 'absence' as const,
  },
];

const UPCOMING = [
  { id: 1, title: 'Morning Row', time: 'Tomorrow 6:00 AM', count: 18, accent: 'var(--data-good)' },
  { id: 2, title: '2k Test Day', time: 'Wed 3:30 PM', count: 24, accent: 'var(--data-warning)' },
  { id: 3, title: 'Race Prep', time: 'Fri 7:00 AM', count: 12, accent: 'var(--data-poor)' },
];

// ============================================
// MOUSE-TRACKING TILT HOOK
// Tracks cursor position within an element and applies
// a subtle 3D perspective rotation via spring physics.
// ============================================

function useTilt(maxTilt = 3) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(0, { stiffness: 300, damping: 30 });
  const rotateY = useSpring(0, { stiffness: 300, damping: 30 });

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      rotateX.set(-y * maxTilt);
      rotateY.set(x * maxTilt);
    },
    [maxTilt, rotateX, rotateY]
  );

  const onLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  return { ref, rotateX, rotateY, onMove, onLeave };
}

// ============================================
// ANIMATED NUMBER — imperative count-up
// ============================================

function AnimatedNumber({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctrl = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = Math.round(v).toString();
      },
    });
    return () => ctrl.stop();
  }, [value, duration]);

  return <span ref={ref}>{value}</span>;
}

// ============================================
// SELF-DRAWING SPARKLINE
// SVG path draws itself via dasharray/dashoffset,
// then fades in a subtle area fill, then the endpoint
// dot appears with a continuously pulsing ring.
// ============================================

function DrawingSparkline({
  data,
  color,
  height = 56,
}: {
  data: number[];
  color: string;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const areaRef = useRef<SVGPathElement>(null);
  const [width, setWidth] = useState(0);

  // Measure container width
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pad = 4;

  const points =
    width > 0
      ? data.map((v, i) => ({
          x: (i / (data.length - 1)) * width,
          y: pad + (height - pad * 2) - ((v - min) / range) * (height - pad * 2),
        }))
      : [];

  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = width > 0 ? `${d} L ${width} ${height} L 0 ${height} Z` : '';
  const last = points[points.length - 1];

  // Animate path draw
  useEffect(() => {
    if (!pathRef.current || width === 0) return;
    const len = pathRef.current.getTotalLength();
    pathRef.current.style.strokeDasharray = `${len}`;
    pathRef.current.style.strokeDashoffset = `${len}`;
    const ctrl = animate(len, 0, {
      duration: 1.8,
      delay: 0.3,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (pathRef.current) pathRef.current.style.strokeDashoffset = `${v}`;
      },
    });
    return () => ctrl.stop();
  }, [width]);

  // Fade in area fill
  useEffect(() => {
    if (!areaRef.current || width === 0) return;
    areaRef.current.style.opacity = '0';
    const ctrl = animate(0, 1, {
      duration: 0.8,
      delay: 1.4,
      onUpdate: (v) => {
        if (areaRef.current) areaRef.current.style.opacity = `${v * 0.06}`;
      },
    });
    return () => ctrl.stop();
  }, [width]);

  return (
    <div ref={containerRef} className="w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} className="overflow-visible">
          <path ref={areaRef} d={areaD} fill={color} opacity={0} />
          <path
            ref={pathRef}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {last && (
            <>
              {/* Endpoint dot */}
              <motion.circle
                cx={last.x}
                cy={last.y}
                r={3.5}
                fill={color}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.8, duration: 0.3 }}
              />
              {/* Pulsing ring — breathes every 4s */}
              <motion.circle
                cx={last.x}
                cy={last.y}
                r={3.5}
                fill="none"
                stroke={color}
                strokeWidth={1}
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: [1, 3], opacity: [0.5, 0] }}
                transition={{
                  delay: 2.2,
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 4,
                  ease: 'easeOut',
                }}
              />
            </>
          )}
        </svg>
      )}
    </div>
  );
}

// ============================================
// ANIMATION VARIANTS
// ============================================

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
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

// Clip-path wipe — reveals left-to-right
const wipeIn = {
  hidden: { clipPath: 'inset(0 100% 0 0)' },
  visible: {
    clipPath: 'inset(0 0% 0 0)',
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

// ============================================
// CANVAS DASHBOARD — MAIN
// ============================================

export function CanvasDashboard() {
  const now = new Date();
  const greeting =
    now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible">
      <HeroSection greeting={greeting} />
      <MetricStrip />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 mt-10">
        <motion.div variants={fadeUp} className="lg:col-span-7 lg:pr-10">
          <ActivityTimeline />
        </motion.div>
        <motion.div
          variants={fadeUp}
          className="lg:col-span-5 lg:border-l lg:border-ink-border lg:pl-10 mt-10 lg:mt-0"
        >
          <UpcomingStack />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ============================================
// HERO SECTION
// Oversized number with perspective tilt + self-drawing sparkline.
// The number IS the design — like a Stripe annual report.
// ============================================

function HeroSection({ greeting }: { greeting: string }) {
  const tilt = useTilt(2.5);

  return (
    <motion.div variants={fadeUp} className="pt-2 pb-8">
      <p className="text-[11px] font-medium text-ink-muted uppercase tracking-[0.2em] mb-8">
        {greeting}
      </p>

      <motion.div
        ref={tilt.ref}
        onMouseMove={tilt.onMove}
        onMouseLeave={tilt.onLeave}
        style={{
          rotateX: tilt.rotateX,
          rotateY: tilt.rotateY,
          transformPerspective: 800,
        }}
      >
        {/* The number — oversized, data-colored, the focal point */}
        <div className="flex items-end gap-2">
          <span
            className="text-[80px] sm:text-[112px] lg:text-[128px] font-mono font-bold leading-[0.82] tracking-[-0.05em]"
            style={{
              color: HERO_METRIC.dataColor,
              fontVariantNumeric: 'tabular-nums',
              textShadow: `0 0 80px color-mix(in srgb, ${HERO_METRIC.dataColor} 15%, transparent)`,
            }}
          >
            <AnimatedNumber value={HERO_METRIC.value} duration={2} />
          </span>
          <span
            className="text-[32px] sm:text-[44px] font-mono font-extralight leading-[0.82] mb-[0.08em]"
            style={{ color: HERO_METRIC.dataColor, opacity: 0.4 }}
          >
            {HERO_METRIC.suffix}
          </span>
        </div>

        {/* Label rule: LABEL ————————————————— context */}
        <div className="flex items-center gap-4 mt-4">
          <span className="text-[11px] font-semibold text-ink-secondary uppercase tracking-[0.15em] shrink-0">
            {HERO_METRIC.label}
          </span>
          <div className="flex-1 h-px bg-ink-border" />
          <span className="text-[11px] text-ink-muted shrink-0">{HERO_METRIC.context}</span>
        </div>

        {/* Self-drawing sparkline — full width */}
        <div className="mt-5">
          <DrawingSparkline
            data={HERO_METRIC.sparkData}
            color={HERO_METRIC.dataColor}
            height={64}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// METRIC STRIP
// Continuous surface with hairline vertical dividers.
// No card gaps — feels like an instrument panel.
// Wipe-reveals left-to-right on mount.
// ============================================

function MetricStrip() {
  return (
    <motion.div variants={wipeIn} className="flex border-y border-ink-border">
      {SECONDARY_METRICS.map((m, i) => {
        const Icon = m.icon;
        return (
          <div
            key={m.id}
            className={`flex-1 py-5 px-5 group cursor-default
                       ${i > 0 ? 'border-l border-ink-border' : ''}
                       relative overflow-hidden`}
          >
            {/* Hover highlight — slides up from bottom */}
            <div
              className="absolute inset-0 bg-ink-raised/60 opacity-0 group-hover:opacity-100
                         translate-y-full group-hover:translate-y-0
                         transition-all duration-300 ease-out"
            />

            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Icon
                  size={12}
                  className="text-ink-muted group-hover:text-ink-secondary transition-colors duration-200"
                />
                <span className="text-[10px] font-medium text-ink-muted uppercase tracking-[0.15em]">
                  {m.label}
                </span>
              </div>
              <span
                className="text-2xl font-mono font-bold tracking-tight block"
                style={{ color: m.dataColor, fontVariantNumeric: 'tabular-nums' }}
              >
                {m.value}
              </span>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

// ============================================
// ACTIVITY TIMELINE
// Bare editorial — no card wrapper. A thin vertical line
// with dot markers. Content floats beside it. Each dot
// is hollow by default; PRs/streaks get a filled dot.
// ============================================

function ActivityTimeline() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.15em]">
          Recent Activity
        </h3>
        <button className="text-[11px] text-ink-tertiary hover:text-ink-primary transition-colors duration-150 flex items-center gap-1.5 group">
          All activity
          <ArrowRight
            size={10}
            className="group-hover:translate-x-0.5 transition-transform duration-150"
          />
        </button>
      </div>

      <div className="relative">
        {/* Vertical timeline line */}
        <motion.div
          className="absolute left-[6px] top-3 bottom-3 w-px bg-ink-border"
          initial={{ scaleY: 0, originY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />

        {TIMELINE.map((item, i) => {
          const isNegative = item.type === 'absence';
          const isMilestone = item.type === 'pr' || item.type === 'streak';

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.4 + i * 0.1,
                duration: 0.45,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative flex items-start gap-5 py-3.5 group cursor-pointer"
            >
              {/* Timeline dot — hollow default, filled for milestones, red border for negative */}
              <div className="relative z-10 mt-1.5 shrink-0">
                <div
                  className="w-[13px] h-[13px] rounded-full border-[1.5px] transition-colors duration-200"
                  style={{
                    borderColor: isNegative
                      ? 'var(--data-poor)'
                      : isMilestone
                        ? 'var(--data-excellent)'
                        : 'var(--ink-border)',
                    backgroundColor: isMilestone ? 'var(--data-excellent)' : 'var(--ink-deep)',
                  }}
                />
              </div>

              {/* Content row */}
              <div className="flex-1 flex items-baseline justify-between min-w-0 pb-3.5 border-b border-ink-border/40 group-last:border-b-0">
                <div className="min-w-0">
                  <span className="text-sm font-medium text-ink-primary">{item.athlete}</span>
                  <span className="text-sm text-ink-muted ml-2.5">{item.action}</span>
                </div>
                <div className="flex items-baseline gap-3 ml-4 shrink-0">
                  <span
                    className="text-sm font-mono font-semibold"
                    style={{
                      color: isNegative ? 'var(--data-poor)' : 'var(--data-good)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {item.value}
                  </span>
                  <span className="text-[10px] text-ink-muted">{item.time}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// UPCOMING STACK
// Session cards with a colored left accent border.
// Each card slides in and shifts right on hover.
// ============================================

function UpcomingStack() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.15em]">
          Upcoming
        </h3>
        <button className="text-[11px] text-ink-tertiary hover:text-ink-primary transition-colors duration-150 flex items-center gap-1.5 group">
          Full schedule
          <ArrowRight
            size={10}
            className="group-hover:translate-x-0.5 transition-transform duration-150"
          />
        </button>
      </div>

      <div className="space-y-3">
        {UPCOMING.map((session, i) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.5 + i * 0.12,
              duration: 0.45,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="group cursor-pointer"
          >
            <div
              className="bg-ink-raised border border-ink-border rounded-lg px-5 py-4
                         hover:border-ink-border-strong
                         group-hover:translate-x-1
                         transition-all duration-200 ease-out"
              style={{ borderLeftWidth: '3px', borderLeftColor: session.accent }}
            >
              <div className="flex items-start justify-between">
                <h4 className="text-sm font-medium text-ink-bright group-hover:text-white transition-colors duration-150">
                  {session.title}
                </h4>
                <span
                  className="text-lg font-mono font-bold leading-none"
                  style={{ color: session.accent, fontVariantNumeric: 'tabular-nums' }}
                >
                  {session.count}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <Clock size={11} className="text-ink-muted" />
                <span className="text-xs text-ink-secondary">{session.time}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default CanvasDashboard;
