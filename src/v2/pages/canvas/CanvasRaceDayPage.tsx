/**
 * CanvasRaceDayPage - Canvas redesign of the Race Day Command Center
 *
 * Canvas Design System Features:
 * - Canvas header with back button and regatta name
 * - CanvasChamferPanel for content sections
 * - RuledHeader for section dividers
 * - ScrambleNumber on countdown timers
 * - CanvasConsoleReadout for bottom status bar
 * - Stagger/fadeUp motion variants
 * - NO rounded corners, NO card wrappers, NO badge pills
 *
 * WRAPS existing V2 sub-components (NextRaceCard, DayTimeline,
 * WarmupSchedule, PreRaceChecklist, ChecklistProgress) in Canvas containers.
 */

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO, isToday, startOfDay, isSameDay } from 'date-fns';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  DayTimeline,
  TimelineLegend,
  NextRaceCard,
  WarmupSchedule,
  PreRaceChecklist,
  ChecklistProgress,
} from '../../components/race-day';
import { useRegatta } from '../../hooks/useRegattas';
import type { RaceDayEvent } from '../../types/regatta';
import { useAuth } from '../../contexts/AuthContext';
import {
  RuledHeader,
  CanvasChamferPanel,
  CanvasButton,
  CanvasConsoleReadout,
} from '@v2/components/canvas';

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
// LOADING STATE
// ============================================

function CanvasRaceDayLoading() {
  return (
    <div className="flex flex-col h-full bg-ink-default">
      <div className="flex-shrink-0 px-6 pt-8 pb-6">
        <div className="h-4 w-24 bg-ink-raised mb-2" />
        <div className="h-12 w-72 bg-ink-raised" />
      </div>
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 bg-ink-raised" />
            <div className="h-64 bg-ink-raised" />
          </div>
          <div className="space-y-4">
            <div className="h-48 bg-ink-raised" />
            <div className="h-48 bg-ink-raised" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// NOT FOUND STATE
// ============================================

function CanvasRegattaNotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col h-full bg-ink-default">
      <div className="flex-shrink-0 px-6 pt-8 pb-6">
        <p className="text-xs font-medium text-ink-muted uppercase tracking-[0.15em] mb-1">
          Racing
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-ink-bright tracking-tight leading-none">
          Command Center
        </h1>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <CanvasChamferPanel className="p-12 text-center max-w-md">
          <p className="text-sm text-ink-secondary mb-4">Regatta not found</p>
          <CanvasButton onClick={onBack} variant="ghost" size="md">
            Back to regattas
          </CanvasButton>
        </CanvasChamferPanel>
      </div>
    </div>
  );
}

// ============================================
// CANVAS RACE DAY PAGE
// ============================================

export function CanvasRaceDayPage() {
  const { regattaId } = useParams<{ regattaId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);

  const { data: regatta, isLoading } = useRegatta(regattaId);

  // Get all races with scheduled times
  const races = useMemo(() => {
    if (!regatta?.events) return [];
    return regatta.events.flatMap((event) =>
      (event.races || []).filter((race) => race.scheduledTime)
    );
  }, [regatta]);

  // Convert races to timeline events
  const timelineEvents = useMemo<RaceDayEvent[]>(() => {
    const events: RaceDayEvent[] = [];

    races.forEach((race) => {
      if (!race.scheduledTime) return;

      const start = new Date(race.scheduledTime);
      const end = new Date(start.getTime() + 30 * 60 * 1000);

      events.push({
        id: race.id,
        title: `${race.eventName} (${race.boatClass})`,
        start,
        end,
        type: 'race',
        raceId: race.id,
      });

      const warmupStart = new Date(start.getTime() - 45 * 60 * 1000);
      events.push({
        id: `warmup-${race.id}`,
        title: `Warmup: ${race.eventName}`,
        start: warmupStart,
        end: new Date(warmupStart.getTime() + 30 * 60 * 1000),
        type: 'warmup',
        raceId: race.id,
      });
    });

    return events;
  }, [races]);

  // Determine race day date
  const raceDate = useMemo(() => {
    if (!regatta) return new Date();
    const regattaStart = parseISO(regatta.date);
    const regattaEnd = regatta.endDate ? parseISO(regatta.endDate) : regattaStart;
    const today = new Date();

    if (isToday(regattaStart) || (today >= regattaStart && today <= regattaEnd)) {
      return startOfDay(today);
    }
    return startOfDay(regattaStart);
  }, [regatta]);

  // Get races for selected date
  const todayRaces = useMemo(() => {
    return races.filter(
      (race) => race.scheduledTime && isSameDay(parseISO(race.scheduledTime), raceDate)
    );
  }, [races, raceDate]);

  const userRole = 'coach' as const;

  if (isLoading) {
    return <CanvasRaceDayLoading />;
  }

  if (!regatta) {
    return <CanvasRegattaNotFound onBack={() => navigate('/app/regattas')} />;
  }

  return (
    <div className="flex flex-col h-full bg-ink-default">
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="flex-shrink-0 px-6 pt-8 pb-6"
      >
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(`/app/regattas/${regattaId}`)}
              className="p-2 text-ink-secondary hover:text-ink-bright transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <TimelineLegend />
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-medium text-ink-muted uppercase tracking-[0.15em] mb-1">
                Racing
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold text-ink-bright tracking-tight leading-none">
                Command Center
              </h1>
              <p className="text-sm font-mono text-ink-secondary mt-2">
                {regatta.name} &mdash; {format(raceDate, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ============================================ */}
      {/* CONTENT */}
      {/* ============================================ */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="flex-1 overflow-y-auto px-6 pb-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Next race card */}
            <motion.div variants={fadeUp}>
              <RuledHeader>Next Race</RuledHeader>
              <CanvasChamferPanel className="p-0 overflow-hidden">
                <NextRaceCard races={todayRaces} />
              </CanvasChamferPanel>
            </motion.div>

            {/* Day timeline */}
            <motion.div variants={fadeUp}>
              <RuledHeader>Today's Schedule</RuledHeader>
              <CanvasChamferPanel className="p-4">
                <DayTimeline
                  raceDate={raceDate}
                  events={timelineEvents.filter((e) => isSameDay(e.start, raceDate))}
                  onSelectEvent={(event) => {
                    if (event.raceId) setSelectedRaceId(event.raceId);
                  }}
                />
              </CanvasChamferPanel>
            </motion.div>
          </div>

          {/* Right column - Warmup & Checklists */}
          <div className="space-y-6">
            {/* Warmup schedule */}
            <motion.div variants={fadeUp}>
              <RuledHeader>Launch Schedule</RuledHeader>
              <CanvasChamferPanel className="p-4">
                <WarmupSchedule
                  races={todayRaces}
                  config={{ warmupDuration: 45, travelToStartTime: 15 }}
                />
              </CanvasChamferPanel>
            </motion.div>

            {/* Checklists */}
            <motion.div variants={fadeUp}>
              <RuledHeader>Pre-Race Checklists</RuledHeader>
              <CanvasChamferPanel className="p-4">
                {selectedRaceId ? (
                  <>
                    <PreRaceChecklist
                      raceId={selectedRaceId}
                      raceName={todayRaces.find((r) => r.id === selectedRaceId)?.eventName || ''}
                      userRole={userRole}
                      userId={user?.id || ''}
                      userName={user?.name}
                    />
                    <button
                      onClick={() => setSelectedRaceId(null)}
                      className="mt-4 w-full text-sm font-mono text-ink-secondary hover:text-ink-bright uppercase tracking-wider transition-colors"
                    >
                      View all races
                    </button>
                  </>
                ) : (
                  <div className="space-y-2">
                    {todayRaces.slice(0, 5).map((race) => (
                      <button
                        key={race.id}
                        onClick={() => setSelectedRaceId(race.id)}
                        className="w-full text-left hover:bg-ink-hover transition-colors"
                      >
                        <ChecklistProgress raceId={race.id} raceName={race.eventName} />
                      </button>
                    ))}
                    {todayRaces.length === 0 && (
                      <p className="text-sm font-mono text-ink-muted text-center py-4 uppercase tracking-wider">
                        No scheduled races for today
                      </p>
                    )}
                  </div>
                )}
              </CanvasChamferPanel>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ============================================ */}
      {/* CONSOLE READOUT */}
      {/* ============================================ */}
      <div className="flex-shrink-0 border-t border-ink-border px-6">
        <CanvasConsoleReadout
          items={[
            { label: 'REGATTA', value: regatta.name.toUpperCase().slice(0, 20) },
            { label: 'RACES TODAY', value: todayRaces.length.toString() },
            { label: 'EVENTS', value: (regatta.events?.length ?? 0).toString() },
            { label: 'DATE', value: format(raceDate, 'MMM d').toUpperCase() },
          ]}
        />
      </div>
    </div>
  );
}

export default CanvasRaceDayPage;
