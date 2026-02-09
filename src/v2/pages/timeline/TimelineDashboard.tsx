/**
 * TimelineDashboard - Main chronological stream page for The Timeline prototype
 *
 * The showcase page for Direction E. Renders a vertical timeline of events
 * organized chronologically, with:
 * - "Now" pulse indicator at the present moment
 * - Date section headers (Today, Yesterday, This Week, etc.)
 * - Mixed event cards: practice sessions, erg tests, regattas, attendance, achievements
 * - Each card type has a distinct left-border accent color
 * - Staggered Framer Motion entrance animations
 * - Filter support via parent-provided activeFilter prop
 *
 * All data is demo/prototype data for visual impact.
 *
 * Design: Direction E - The Timeline prototype
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Dumbbell,
  Timer,
  Trophy,
  Users,
  Award,
  TrendingUp,
  MapPin,
  Zap,
  Clock,
  ChevronRight,
} from 'lucide-react';
import type { EventFilter } from '@v2/components/shell/TimelineScrubber';
import type { TimeScope } from '@v2/components/shell/TimelineRail';

// ============================================
// TYPES
// ============================================

type EventType = 'training' | 'erg' | 'regatta' | 'attendance' | 'achievement';

interface TimelineEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  timestamp: Date;
  relativeTime: string;
  metrics?: { label: string; value: string }[];
  athletes?: string[];
  location?: string;
  badge?: string;
  highlight?: boolean;
}

interface TimelineSection {
  label: string;
  sublabel?: string;
  events: TimelineEvent[];
}

interface TimelineDashboardProps {
  activeFilter: EventFilter;
  activeScope: TimeScope;
}

// ============================================
// EVENT TYPE CONFIG
// ============================================

const EVENT_CONFIG: Record<
  EventType,
  {
    borderColor: string;
    bgColor: string;
    icon: React.ElementType;
    label: string;
    badgeColor: string;
  }
> = {
  training: {
    borderColor: 'border-l-amber-500',
    bgColor: 'bg-amber-500/5',
    icon: Dumbbell,
    label: 'Training',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  erg: {
    borderColor: 'border-l-indigo-500',
    bgColor: 'bg-indigo-500/5',
    icon: Timer,
    label: 'Erg Test',
    badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  },
  regatta: {
    borderColor: 'border-l-rose-500',
    bgColor: 'bg-rose-500/5',
    icon: Trophy,
    label: 'Regatta',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
  attendance: {
    borderColor: 'border-l-teal-500',
    bgColor: 'bg-teal-500/5',
    icon: Users,
    label: 'Attendance',
    badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  },
  achievement: {
    borderColor: 'border-l-emerald-500',
    bgColor: 'bg-emerald-500/5',
    icon: Award,
    label: 'Achievement',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
};

// Map EventFilter to EventType(s)
const FILTER_MAP: Record<EventFilter, EventType[] | null> = {
  all: null,
  training: ['training'],
  performance: ['erg'],
  competitions: ['regatta'],
  milestones: ['attendance', 'achievement'],
};

// ============================================
// DEMO DATA - Prototype event stream
// ============================================

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000);
const daysFromNow = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

/** Demo timeline events - clearly marked as prototype data */
const DEMO_EVENTS: TimelineEvent[] = [
  // UPCOMING (future)
  {
    id: 'e-future-3',
    type: 'regatta',
    title: 'San Diego Crew Classic',
    description: 'Varsity 8+ and JV 4+ entries confirmed. Lane assignments pending.',
    timestamp: daysFromNow(12),
    relativeTime: 'In 12 days',
    location: 'Mission Bay, San Diego',
    metrics: [
      { label: 'Entries', value: '2 boats' },
      { label: 'Athletes', value: '14' },
    ],
    athletes: ['Full Varsity Squad'],
    badge: 'Upcoming',
  },
  {
    id: 'e-future-2',
    type: 'training',
    title: 'Race Simulation - Full Pressure 2k',
    description: 'Final high-intensity session before SDCC. Simulate race start sequence.',
    timestamp: daysFromNow(3),
    relativeTime: 'In 3 days',
    metrics: [
      { label: 'Planned', value: '2000m' },
      { label: 'Intensity', value: 'Race' },
    ],
    athletes: ['V8+ Crew', 'JV4+ Crew'],
    badge: 'Scheduled',
  },
  {
    id: 'e-future-1',
    type: 'training',
    title: 'Morning Water Session - Steady State',
    description: 'Technical focus: catch timing and blade work. 12km planned.',
    timestamp: hoursFromNow(14),
    relativeTime: 'Tomorrow 6:00 AM',
    metrics: [
      { label: 'Distance', value: '12 km' },
      { label: 'Rate', value: '18-22' },
    ],
    athletes: ['All Athletes'],
    badge: 'Scheduled',
  },

  // TODAY
  {
    id: 'e-today-1',
    type: 'training',
    title: 'Afternoon Erg Session - 4x2k Intervals',
    description: 'Completed. Strong performance across the board. 3 athletes hit new interval PRs.',
    timestamp: hoursAgo(2),
    relativeTime: '2 hours ago',
    metrics: [
      { label: 'Avg Split', value: '1:42.3' },
      { label: 'Total Meters', value: '8,000' },
      { label: 'PR Count', value: '3' },
    ],
    athletes: ['Marcus Chen', 'Sarah Okafor', 'James Wright', 'Emily Torres', '+8 more'],
    highlight: true,
  },
  {
    id: 'e-today-2',
    type: 'achievement',
    title: 'Marcus Chen - New 2k PR',
    description: 'Pulled a 6:12.4 during the interval session. Previous PR was 6:18.1.',
    timestamp: hoursAgo(2),
    relativeTime: '2 hours ago',
    metrics: [
      { label: 'New PR', value: '6:12.4' },
      { label: 'Previous', value: '6:18.1' },
      { label: 'Improvement', value: '-5.7s' },
    ],
    athletes: ['Marcus Chen'],
    badge: 'Personal Record',
    highlight: true,
  },
  {
    id: 'e-today-3',
    type: 'attendance',
    title: 'Morning Practice Attendance',
    description: '22 of 24 athletes checked in. 2 excused absences (illness).',
    timestamp: hoursAgo(8),
    relativeTime: '8 hours ago',
    metrics: [
      { label: 'Present', value: '22/24' },
      { label: 'Rate', value: '91.7%' },
    ],
    athletes: ['Full Roster'],
  },
  {
    id: 'e-today-4',
    type: 'training',
    title: 'Morning Water Session - Technical Drills',
    description: 'Worked on pause drills and ratio work at 16-18 spm. Good conditions.',
    timestamp: hoursAgo(9),
    relativeTime: '9 hours ago',
    metrics: [
      { label: 'Distance', value: '14.2 km' },
      { label: 'Duration', value: '1:45:00' },
      { label: 'Avg Rate', value: '17 spm' },
    ],
    athletes: ['V8+ Crew', 'V4+ Crew', 'Novice 8+'],
  },

  // YESTERDAY
  {
    id: 'e-yest-1',
    type: 'erg',
    title: '6k Erg Test - Full Team',
    description: 'Bi-weekly benchmark test. 4 new PRs across the squad.',
    timestamp: daysAgo(1),
    relativeTime: 'Yesterday',
    metrics: [
      { label: 'Best Split', value: '1:48.2' },
      { label: 'Team Avg', value: '1:54.6' },
      { label: 'PRs', value: '4' },
    ],
    athletes: ['Marcus Chen', 'Sarah Okafor', 'James Wright', 'Emily Torres', '+18 more'],
    highlight: true,
  },
  {
    id: 'e-yest-2',
    type: 'achievement',
    title: 'Emily Torres - 100th Practice Milestone',
    description: 'Reached 100 consecutive practices with no unexcused absences.',
    timestamp: daysAgo(1),
    relativeTime: 'Yesterday',
    athletes: ['Emily Torres'],
    badge: 'Iron Oar',
  },

  // THIS WEEK
  {
    id: 'e-week-1',
    type: 'regatta',
    title: 'Bay Area Invitational - Results',
    description: 'V8+ placed 2nd overall. JV4+ won their heat. Strong showing.',
    timestamp: daysAgo(4),
    relativeTime: '4 days ago',
    location: 'Oakland Estuary',
    metrics: [
      { label: 'V8+ Place', value: '2nd' },
      { label: 'JV4+ Place', value: '1st' },
      { label: 'Time (V8+)', value: '6:02.8' },
    ],
    athletes: ['V8+ Crew', 'JV4+ Crew'],
    highlight: true,
  },
  {
    id: 'e-week-2',
    type: 'training',
    title: 'Race Week Taper - Light Paddle',
    description: 'Pre-regatta taper. Focus on relaxation, bladework, starts.',
    timestamp: daysAgo(5),
    relativeTime: '5 days ago',
    metrics: [
      { label: 'Distance', value: '8 km' },
      { label: 'Rate', value: '16-20' },
    ],
    athletes: ['Racing Crews'],
  },
  {
    id: 'e-week-3',
    type: 'attendance',
    title: 'Weekly Attendance Summary',
    description: 'Overall attendance rate 94.2% this week. Best of the season so far.',
    timestamp: daysAgo(6),
    relativeTime: '6 days ago',
    metrics: [
      { label: 'Weekly Rate', value: '94.2%' },
      { label: 'Perfect', value: '18 athletes' },
    ],
    badge: 'Season Best',
  },

  // EARLIER THIS MONTH
  {
    id: 'e-month-1',
    type: 'erg',
    title: '2k Erg Test - Selection Trials',
    description: 'Official 2k tests for boat selection. Results posted to rankings.',
    timestamp: daysAgo(12),
    relativeTime: '12 days ago',
    metrics: [
      { label: 'Fastest', value: '6:12.4' },
      { label: 'Team Avg', value: '6:38.2' },
      { label: 'Tested', value: '22' },
    ],
    athletes: ['Full Squad'],
    highlight: true,
  },
  {
    id: 'e-month-2',
    type: 'achievement',
    title: 'Team Record - Fastest V8+ 2k Average',
    description:
      'The varsity 8+ posted a combined average of 6:22.1, beating the 2024 record by 3.2 seconds.',
    timestamp: daysAgo(12),
    relativeTime: '12 days ago',
    badge: 'Team Record',
    highlight: true,
  },
  {
    id: 'e-month-3',
    type: 'training',
    title: 'Seat Racing Block - Day 3 of 3',
    description: 'Final seat racing combinations completed. Selection committee to review.',
    timestamp: daysAgo(15),
    relativeTime: '15 days ago',
    metrics: [
      { label: 'Pairs Raced', value: '8' },
      { label: 'Pieces', value: '12' },
    ],
    athletes: ['Selection Pool'],
  },
  {
    id: 'e-month-4',
    type: 'regatta',
    title: 'Presidents Day Regatta',
    description: 'Season opener. V8+ qualified for grand final, finished 4th. Good benchmark.',
    timestamp: daysAgo(22),
    relativeTime: '3 weeks ago',
    location: 'Lake Natoma, Sacramento',
    metrics: [
      { label: 'V8+ Place', value: '4th' },
      { label: 'Time', value: '6:11.4' },
      { label: 'Margin', value: '+4.2s' },
    ],
    athletes: ['V8+ Crew'],
  },
];

// ============================================
// TIME SECTION GROUPING
// ============================================

function groupEventsIntoSections(events: TimelineEvent[], scope: TimeScope): TimelineSection[] {
  const sorted = [...events].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // For "today" scope, show more granular time (morning/afternoon/evening)
  // For larger scopes, group by day/week
  const sections: TimelineSection[] = [];
  const sectionMap = new Map<string, TimelineEvent[]>();

  sorted.forEach((event) => {
    const diffMs = now.getTime() - event.timestamp.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    let key: string;
    if (diffMs < 0) {
      // Future events
      const futureDays = Math.abs(diffDays);
      if (futureDays < 1) key = 'upcoming-today';
      else if (futureDays < 7) key = 'upcoming-week';
      else key = 'upcoming-later';
    } else if (diffHours < 24 && event.timestamp.getDate() === now.getDate()) {
      key = 'today';
    } else if (diffDays < 2) {
      key = 'yesterday';
    } else if (diffDays < 7) {
      key = 'this-week';
    } else if (diffDays < 30) {
      key = 'this-month';
    } else {
      key = 'earlier';
    }

    if (!sectionMap.has(key)) sectionMap.set(key, []);
    sectionMap.get(key)!.push(event);
  });

  const sectionOrder = [
    'upcoming-later',
    'upcoming-week',
    'upcoming-today',
    'today',
    'yesterday',
    'this-week',
    'this-month',
    'earlier',
  ];

  const sectionLabels: Record<string, { label: string; sublabel?: string }> = {
    'upcoming-later': { label: 'Coming Up', sublabel: 'Next 2+ weeks' },
    'upcoming-week': { label: 'This Week', sublabel: 'Upcoming' },
    'upcoming-today': { label: 'Later Today', sublabel: 'Upcoming' },
    today: {
      label: 'Today',
      sublabel: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    },
    yesterday: { label: 'Yesterday' },
    'this-week': { label: 'Earlier This Week' },
    'this-month': { label: 'This Month' },
    earlier: { label: 'Earlier' },
  };

  // Filter by scope
  const scopeFilter: Record<TimeScope, string[]> = {
    today: ['upcoming-today', 'today'],
    week: ['upcoming-today', 'upcoming-week', 'today', 'yesterday', 'this-week'],
    month: [
      'upcoming-today',
      'upcoming-week',
      'upcoming-later',
      'today',
      'yesterday',
      'this-week',
      'this-month',
    ],
    season: sectionOrder,
    all: sectionOrder,
  };

  const allowedSections = scopeFilter[scope];

  sectionOrder.forEach((key) => {
    if (!allowedSections.includes(key)) return;
    const events = sectionMap.get(key);
    if (events && events.length > 0) {
      const meta = sectionLabels[key] || { label: key };
      sections.push({ label: meta.label, sublabel: meta.sublabel, events });
    }
  });

  return sections;
}

// ============================================
// NOW INDICATOR
// ============================================

function NowIndicator() {
  return (
    <div className="relative flex items-center gap-3 py-6">
      {/* Timeline line connector */}
      <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-ink-border/40 via-amber-500/40 to-ink-border/40" />

      {/* Glowing pulse dot */}
      <div className="relative z-10 flex items-center justify-center w-10 h-10">
        {/* Outer pulse ring */}
        <motion.div
          className="absolute w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20"
          animate={{
            scale: [1, 1.6, 1],
            opacity: [0.4, 0, 0.4],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {/* Middle pulse ring */}
        <motion.div
          className="absolute w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 0.2, 0.6],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.3,
          }}
        />
        {/* Core dot */}
        <div className="w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/40 z-10" />
      </div>

      {/* Now label */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-display font-semibold text-amber-400 tracking-wide">Now</span>
        <span className="text-xs font-mono text-ink-secondary">
          {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Horizontal glow line */}
      <div className="flex-1 h-px bg-gradient-to-r from-amber-500/30 via-amber-500/10 to-transparent" />
    </div>
  );
}

// ============================================
// SECTION HEADER
// ============================================

function SectionHeader({ label, sublabel }: { label: string; sublabel?: string }) {
  return (
    <div className="relative flex items-center gap-3 py-4">
      {/* Timeline node */}
      <div className="relative z-10 flex items-center justify-center w-10">
        <div className="w-2 h-2 rounded-full bg-ink-border" />
      </div>

      {/* Label */}
      <div className="flex items-baseline gap-3">
        <h3 className="font-display text-xl text-ink-bright tracking-tight">{label}</h3>
        {sublabel && <span className="text-xs font-mono text-ink-tertiary">{sublabel}</span>}
      </div>

      {/* Decorative line */}
      <div className="flex-1 h-px bg-ink-border/20" />
    </div>
  );
}

// ============================================
// EVENT CARD
// ============================================

function EventCard({ event, index }: { event: TimelineEvent; index: number }) {
  const config = EVENT_CONFIG[event.type];
  const Icon = config.icon;

  return (
    <motion.div
      className="relative flex gap-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {/* Timeline node */}
      <div className="relative z-10 flex items-start justify-center w-10 pt-4">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center
                      ${config.bgColor} border border-ink-border/30`}
        >
          <Icon size={14} className="text-ink-primary" />
        </div>
      </div>

      {/* Card */}
      <div
        className={`flex-1 border-l-2 ${config.borderColor}
                    bg-ink-raised/60 backdrop-blur-sm
                    border border-ink-border/20 rounded-r-xl rounded-l-sm
                    p-4 mb-3
                    hover:bg-ink-raised/80 hover:border-ink-border/40
                    transition-all duration-200 cursor-pointer group`}
      >
        {/* Header row */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type badge */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono
                         uppercase tracking-wider border ${config.badgeColor}`}
            >
              {config.label}
            </span>
            {/* Special badge */}
            {event.badge && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px]
                             font-mono uppercase tracking-wider
                             bg-amber-500/10 text-amber-400 border border-amber-500/20"
              >
                <Zap size={8} />
                {event.badge}
              </span>
            )}
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-1 text-[11px] font-mono text-ink-tertiary shrink-0 ml-2">
            <Clock size={10} />
            {event.relativeTime}
          </div>
        </div>

        {/* Title */}
        <h4 className="text-sm font-semibold text-ink-bright mb-1 group-hover:text-white transition-colors">
          {event.title}
        </h4>

        {/* Description */}
        <p className="text-xs text-ink-secondary leading-relaxed mb-3">{event.description}</p>

        {/* Metrics row */}
        {event.metrics && event.metrics.length > 0 && (
          <div className="flex items-center gap-4 mb-3">
            {event.metrics.map((m) => (
              <div key={m.label} className="flex items-baseline gap-1.5">
                <span className="text-xs text-ink-tertiary">{m.label}</span>
                <span className="text-sm font-mono font-semibold text-ink-primary">{m.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Bottom row: athletes + location */}
        <div className="flex items-center justify-between text-[11px] text-ink-tertiary">
          <div className="flex items-center gap-3">
            {event.athletes && event.athletes.length > 0 && (
              <div className="flex items-center gap-1">
                <Users size={10} />
                <span>{event.athletes.join(', ')}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-1">
                <MapPin size={10} />
                <span>{event.location}</span>
              </div>
            )}
          </div>

          {/* View detail arrow */}
          <ChevronRight
            size={14}
            className="text-ink-tertiary group-hover:text-ink-primary group-hover:translate-x-0.5
                       transition-all duration-200"
          />
        </div>

        {/* Highlight glow effect for notable events */}
        {event.highlight && (
          <div
            className="absolute inset-0 rounded-r-xl rounded-l-sm pointer-events-none
                       bg-gradient-to-r from-transparent via-transparent to-amber-500/[0.02]"
          />
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyState({ filter }: { filter: EventFilter }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div
        className="w-16 h-16 rounded-2xl bg-ink-raised border border-ink-border/30
                      flex items-center justify-center mb-4"
      >
        <TrendingUp size={24} className="text-ink-tertiary" />
      </div>
      <h3 className="text-lg font-display text-ink-primary mb-1">No events found</h3>
      <p className="text-sm text-ink-secondary max-w-sm">
        {filter === 'all'
          ? 'Nothing in this time period yet. Events will appear here as they happen.'
          : `No ${filter} events in this time period. Try widening your time scope or changing the filter.`}
      </p>
    </motion.div>
  );
}

// ============================================
// STATS SUMMARY BAR
// ============================================

function StatsSummary({ events }: { events: TimelineEvent[] }) {
  const stats = useMemo(() => {
    const training = events.filter((e) => e.type === 'training').length;
    const erg = events.filter((e) => e.type === 'erg').length;
    const regattas = events.filter((e) => e.type === 'regatta').length;
    const achievements = events.filter((e) => e.type === 'achievement').length;
    return { training, erg, regattas, achievements, total: events.length };
  }, [events]);

  return (
    <motion.div
      className="flex items-center gap-6 px-4 py-3 mb-6
                 bg-ink-raised/40 backdrop-blur-sm rounded-xl
                 border border-ink-border/20"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-metric font-bold text-ink-bright">{stats.total}</span>
        <span className="text-xs text-ink-tertiary">events</span>
      </div>
      <div className="w-px h-6 bg-ink-border/30" />
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span className="text-ink-secondary">{stats.training} training</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span className="text-ink-secondary">{stats.erg} erg</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span className="text-ink-secondary">{stats.regattas} regattas</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-ink-secondary">{stats.achievements} milestones</span>
        </span>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function TimelineDashboard({ activeFilter, activeScope }: TimelineDashboardProps) {
  // Filter events by type
  const filteredEvents = useMemo(() => {
    const allowedTypes = FILTER_MAP[activeFilter];
    if (!allowedTypes) return DEMO_EVENTS;
    return DEMO_EVENTS.filter((e) => allowedTypes.includes(e.type));
  }, [activeFilter]);

  // Group into sections
  const sections = useMemo(
    () => groupEventsIntoSections(filteredEvents, activeScope),
    [filteredEvents, activeScope]
  );

  // Find where "now" should be inserted
  const nowSectionIndex = sections.findIndex((s) => s.label === 'Today');

  return (
    <div className="max-w-3xl mx-auto">
      {/* Stats summary */}
      <StatsSummary events={filteredEvents} />

      {/* Timeline stream */}
      <div className="relative">
        {/* Continuous timeline line */}
        <div
          className="absolute left-[19px] top-0 bottom-0 w-px"
          style={{
            background:
              'linear-gradient(to bottom, transparent 0%, rgba(64,64,64,0.3) 5%, rgba(64,64,64,0.4) 40%, rgba(251,191,36,0.3) 50%, rgba(64,64,64,0.4) 60%, rgba(64,64,64,0.3) 95%, transparent 100%)',
          }}
        />

        {sections.length === 0 ? (
          <EmptyState filter={activeFilter} />
        ) : (
          sections.map((section, sectionIdx) => (
            <div key={section.label}>
              {/* Insert NOW indicator before the "Today" section */}
              {sectionIdx === nowSectionIndex && nowSectionIndex === 0 && <NowIndicator />}

              {/* Section header */}
              <SectionHeader label={section.label} sublabel={section.sublabel} />

              {/* Insert NOW indicator after the section header for "Today" */}
              {sectionIdx === nowSectionIndex && nowSectionIndex > 0 && <NowIndicator />}

              {/* Events in this section */}
              {section.events.map((event, eventIdx) => (
                <EventCard key={event.id} event={event} index={eventIdx} />
              ))}
            </div>
          ))
        )}

        {/* Timeline end cap */}
        <div className="relative flex items-center justify-center py-6">
          <div className="w-4 h-4 rounded-full border-2 border-ink-border/40 bg-ink-deep" />
        </div>
      </div>
    </div>
  );
}

export default TimelineDashboard;
