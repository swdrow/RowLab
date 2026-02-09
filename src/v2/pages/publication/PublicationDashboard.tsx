/**
 * PublicationDashboard - Editorial-style coach dashboard
 *
 * Feels like opening a magazine to the first page.
 * Giant serif typography, pull-quote metrics, asymmetric bento grid,
 * and data that glows with purpose.
 *
 * Structure:
 * 1. Editorial Cover - contextual greeting, giant metric, date
 * 2. Bento Grid - asymmetric dashboard widgets
 * 3. Highlights Section - pull-quote metrics, editorial cards
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  Activity,
  ChevronRight,
  Trophy,
} from 'lucide-react';
import { useAuth } from '@v2/contexts/AuthContext';

// ============================================
// Helper: Time-based greeting
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
    year: 'numeric',
  });
}

// ============================================
// Stagger animation variants
// ============================================

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

// ============================================
// Main Component
// ============================================

export function PublicationDashboard() {
  const { user } = useAuth();
  const greeting = useMemo(() => getGreeting(), []);
  const formattedDate = useMemo(() => getFormattedDate(), []);
  const firstName = user?.name?.split(' ')[0] || 'Coach';

  return (
    <div className="min-h-screen bg-ink-deep">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-6 py-10"
      >
        {/* ============================================
            EDITORIAL COVER SECTION
            ============================================ */}
        <motion.section variants={fadeUp} className="mb-16">
          {/* Date line */}
          <p className="text-[10px] uppercase tracking-[0.3em] text-ink-secondary mb-6">
            {formattedDate}
          </p>

          {/* Large serif greeting */}
          <h1 className="font-display text-5xl font-bold text-ink-bright tracking-tight mb-3">
            {greeting}, {firstName}.
          </h1>

          {/* Status subtitle */}
          <p className="text-lg text-ink-body mb-10 max-w-xl">
            Here is what is happening with your team today.
          </p>

          {/* Giant hero metric */}
          <div className="flex items-baseline gap-6">
            <span
              className="font-display text-[96px] leading-none font-bold text-ink-bright"
              style={{ textShadow: '0 0 80px rgba(250, 250, 250, 0.06)' }}
            >
              4
            </span>
            <div>
              <p className="text-lg text-ink-body">sessions this week</p>
              <p className="text-sm text-ink-secondary mt-1">2 completed, 2 remaining</p>
            </div>
          </div>
        </motion.section>

        {/* ============================================
            BENTO GRID - Asymmetric dashboard widgets
            ============================================ */}
        <motion.section variants={fadeUp} className="mb-16">
          {/* Section header */}
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-ink-secondary">
              At a Glance
            </h2>
            <div className="flex-1 h-px bg-ink-border" />
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-12 gap-4">
            {/* Upcoming Session - Large (6 cols) */}
            <BentoCard className="col-span-6 row-span-2" size="large">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarDays size={14} className="text-ink-secondary" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-ink-secondary">
                    Next Session
                  </span>
                </div>
                <h3 className="font-display text-2xl font-semibold text-ink-bright mb-2">
                  Morning Row
                </h3>
                <p className="text-sm text-ink-body mb-1">Wednesday, 6:00 AM</p>
                <p className="text-xs text-ink-secondary mb-6">Charles River Basin, Dock 3</p>

                {/* Lineup preview */}
                <div className="mt-auto space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-ink-secondary">
                    Planned Lineups
                  </p>
                  <div className="flex gap-2">
                    {['V8+', '2V8+', '4+'].map((boat) => (
                      <span
                        key={boat}
                        className="px-3 py-1 text-xs font-mono text-ink-body border border-ink-border rounded-md"
                      >
                        {boat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <button className="mt-4 self-start flex items-center gap-2 px-4 py-2 text-sm font-medium bg-ink-bright text-ink-deep rounded-md hover:bg-ink-primary transition-colors">
                  View Session
                  <ChevronRight size={14} />
                </button>
              </div>
            </BentoCard>

            {/* Attendance Summary - Medium (3 cols) */}
            <BentoCard className="col-span-3">
              <div className="flex items-center gap-2 mb-4">
                <Users size={14} className="text-ink-secondary" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-ink-secondary">
                  Attendance
                </span>
              </div>
              <div className="mb-3">
                <span
                  className="font-display text-4xl font-bold text-data-excellent"
                  style={{ textShadow: '0 0 20px rgba(34, 197, 94, 0.3)' }}
                >
                  94%
                </span>
              </div>
              <p className="text-xs text-ink-secondary">This week average</p>
              <div className="mt-3 flex items-center gap-1.5">
                <TrendingUp size={12} className="text-data-excellent" />
                <span className="text-xs text-data-excellent">+3% from last week</span>
              </div>
            </BentoCard>

            {/* Quick Stats - Small (3 cols) */}
            <BentoCard className="col-span-3">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={14} className="text-ink-secondary" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-ink-secondary">
                  Quick Stats
                </span>
              </div>
              <div className="space-y-3">
                <StatRow label="Active Athletes" value="32" />
                <StatRow label="Avg 2k" value="6:42" color="data-good" />
                <StatRow label="Boats Available" value="7" />
                <StatRow label="Injured" value="2" color="data-warning" />
              </div>
            </BentoCard>

            {/* Recent Activity - Wide (8 cols) */}
            <BentoCard className="col-span-8">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={14} className="text-ink-secondary" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-ink-secondary">
                  Recent Activity
                </span>
              </div>
              <div className="space-y-0">
                <ActivityRow
                  time="2h ago"
                  text="Erg test results imported for 12 athletes"
                  accent="data-good"
                />
                <ActivityRow
                  time="5h ago"
                  text="V8+ lineup updated for Saturday regatta"
                  accent="ink-body"
                />
                <ActivityRow
                  time="1d ago"
                  text="Sarah Chen set a new 2k PR: 7:12.4"
                  accent="data-excellent"
                />
                <ActivityRow
                  time="2d ago"
                  text="Attendance alert: 3 athletes missed practice"
                  accent="data-warning"
                />
              </div>
            </BentoCard>

            {/* Alerts - Tall (4 cols) */}
            <BentoCard className="col-span-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={14} className="text-data-warning" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-ink-secondary">
                  Alerts
                </span>
                <span className="ml-auto px-2 py-0.5 text-[10px] font-mono font-medium text-data-warning bg-data-warning/10 rounded">
                  3
                </span>
              </div>
              <div className="space-y-3">
                <AlertItem
                  title="Weight check needed"
                  detail="4 athletes have not logged weight this week"
                  severity="warning"
                />
                <AlertItem
                  title="Lineup incomplete"
                  detail="Saturday V4+ is missing seat 3"
                  severity="warning"
                />
                <AlertItem
                  title="Erg test overdue"
                  detail="6 athletes are overdue for 2k test"
                  severity="info"
                />
              </div>
            </BentoCard>
          </div>
        </motion.section>

        {/* ============================================
            HIGHLIGHTS SECTION
            ============================================ */}
        <motion.section variants={fadeUp} className="mb-16">
          {/* Section header */}
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-ink-secondary">
              This Week&rsquo;s Highlights
            </h2>
            <div className="flex-1 h-px bg-ink-border" />
          </div>

          {/* Pull-quote metric */}
          <div className="mb-8 flex items-baseline gap-4">
            <span
              className="font-display text-6xl font-bold text-data-excellent"
              style={{ textShadow: '0 0 40px rgba(34, 197, 94, 0.2)' }}
            >
              3
            </span>
            <div>
              <p className="text-xl text-ink-bright font-display">personal records set</p>
              <p className="text-sm text-ink-secondary">Best week since October</p>
            </div>
          </div>

          {/* Highlight cards grid */}
          <div className="grid grid-cols-3 gap-4">
            <HighlightCard
              icon={<Trophy size={16} className="text-data-excellent" />}
              title="Sarah Chen"
              metric="7:12.4"
              metricColor="data-excellent"
              detail="New 2k PR, improved by 4.2s"
            />
            <HighlightCard
              icon={<Trophy size={16} className="text-data-good" />}
              title="Marcus Rivera"
              metric="6:28.1"
              metricColor="data-good"
              detail="New 2k PR, improved by 1.8s"
            />
            <HighlightCard
              icon={<Trophy size={16} className="text-data-excellent" />}
              title="James Park"
              metric="1:42.3"
              metricColor="data-excellent"
              detail="New 500m PR, improved by 0.9s"
            />
          </div>
        </motion.section>

        {/* ============================================
            FOOTER NOTE
            ============================================ */}
        <motion.div variants={fadeUp} className="pb-12">
          <p className="text-[10px] uppercase tracking-[0.3em] text-ink-muted text-center">
            RowLab Publication View — Design Prototype
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

/** Bento card container with consistent styling */
function BentoCard({
  children,
  className = '',
  size = 'normal',
}: {
  children: React.ReactNode;
  className?: string;
  size?: 'normal' | 'large';
}) {
  return (
    <div
      className={`
        border border-ink-border rounded-lg bg-ink-base/50
        hover:border-ink-border-strong transition-colors duration-150
        ${size === 'large' ? 'p-6' : 'p-5'}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/** Stat row for Quick Stats widget */
function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-ink-secondary">{label}</span>
      <span
        className={`font-mono text-sm font-medium ${color ? `text-${color}` : 'text-ink-bright'}`}
        style={
          color ? { textShadow: `0 0 12px var(--${color.replace('data-', 'glow-')})` } : undefined
        }
      >
        {value}
      </span>
    </div>
  );
}

/** Activity row for Recent Activity widget */
function ActivityRow({ time, text, accent }: { time: string; text: string; accent: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-ink-border/50 last:border-0">
      <span className="text-[10px] font-mono text-ink-muted whitespace-nowrap pt-0.5 w-12">
        {time}
      </span>
      <p className={`text-sm text-${accent}`}>{text}</p>
    </div>
  );
}

/** Alert item for Alerts widget */
function AlertItem({
  title,
  detail,
  severity,
}: {
  title: string;
  detail: string;
  severity: 'warning' | 'error' | 'info';
}) {
  const colors = {
    warning: 'border-l-data-warning',
    error: 'border-l-data-poor',
    info: 'border-l-data-good',
  };

  return (
    <div className={`border-l-2 ${colors[severity]} pl-3 py-1`}>
      <p className="text-sm text-ink-body font-medium">{title}</p>
      <p className="text-xs text-ink-secondary mt-0.5">{detail}</p>
    </div>
  );
}

/** Highlight card for the weekly highlights section */
function HighlightCard({
  icon,
  title,
  metric,
  metricColor,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  metric: string;
  metricColor: string;
  detail: string;
}) {
  return (
    <div className="border border-ink-border rounded-lg p-4 hover:border-ink-border-strong transition-colors">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-sm font-medium text-ink-bright">{title}</span>
      </div>
      <p
        className={`font-mono text-2xl font-bold text-${metricColor} mb-1`}
        style={{
          textShadow: `0 0 20px var(--${metricColor.replace('data-', 'glow-')})`,
        }}
      >
        {metric}
      </p>
      <p className="text-xs text-ink-secondary">{detail}</p>
    </div>
  );
}

export default PublicationDashboard;
