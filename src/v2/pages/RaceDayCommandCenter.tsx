import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO, isToday, startOfDay, isSameDay } from 'date-fns';
import { ChevronLeft, Calendar, Clock } from 'lucide-react';
import {
  DayTimeline,
  TimelineLegend,
  NextRaceCard,
  WarmupSchedule,
  PreRaceChecklist,
  ChecklistProgress,
} from '../components/race-day';
import { useRegatta } from '../hooks/useRegattas';
import type { RaceDayEvent } from '../types/regatta';
import { useAuth } from '../contexts/AuthContext';

export function RaceDayCommandCenter() {
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
      const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 min duration

      // Race event
      events.push({
        id: race.id,
        title: `${race.eventName} (${race.boatClass})`,
        start,
        end,
        type: 'race',
        raceId: race.id,
      });

      // Warmup event (45 min before race)
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

  // Determine race day date (today if regatta includes today, otherwise regatta start)
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

  // Get user role for checklist
  const userRole = useMemo(() => {
    // Determine from team membership - simplified for now
    return 'coach' as const;
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="relative px-6 pt-8 pb-6 mb-2 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-accent-copper/[0.06] via-accent-copper/[0.02] to-transparent pointer-events-none" />
          <div className="absolute bottom-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-accent-copper/30 to-transparent" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-copper mb-1">
              Race Day
            </p>
            <h1 className="text-4xl font-display font-bold text-ink-bright tracking-tight">
              Command Center
            </h1>
          </div>
        </div>
        <div className="px-6 animate-pulse space-y-4">
          <div className="h-64 bg-ink-raised rounded-xl" />
        </div>
      </div>
    );
  }

  if (!regatta) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="relative px-6 pt-8 pb-6 mb-2 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-accent-copper/[0.06] via-accent-copper/[0.02] to-transparent pointer-events-none" />
          <div className="absolute bottom-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-accent-copper/30 to-transparent" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-copper mb-1">
              Race Day
            </p>
            <h1 className="text-4xl font-display font-bold text-ink-bright tracking-tight">
              Command Center
            </h1>
          </div>
        </div>
        <div className="px-6 text-center py-12">
          <p className="text-ink-secondary">Regatta not found</p>
          <button
            onClick={() => navigate('/app/regattas')}
            className="mt-4 text-accent-copper hover:text-accent-copper-hover font-medium transition-colors"
          >
            Back to regattas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Header */}
      <div className="relative px-6 pt-8 pb-6 mb-2 overflow-hidden">
        {/* Warm gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent-copper/[0.06] via-accent-copper/[0.02] to-transparent pointer-events-none" />
        {/* Decorative copper line at bottom */}
        <div className="absolute bottom-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-accent-copper/30 to-transparent" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/app/regattas/${regattaId}`)}
              className="p-2 rounded-lg hover:bg-ink-hover text-accent-copper transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-copper mb-1">
                Race Day
              </p>
              <h1 className="text-4xl font-display font-bold text-ink-bright tracking-tight">
                Command Center
              </h1>
              <p className="text-sm text-ink-secondary mt-1">
                {regatta.name} — {format(raceDate, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </div>

          <TimelineLegend />
        </div>
      </div>

      <div className="px-6">
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Next race card */}
            <NextRaceCard races={todayRaces} />

            {/* Day timeline */}
            <div className="bg-ink-raised rounded-xl border border-ink-border p-4">
              <h3 className="font-medium text-ink-bright mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent-copper" />
                Today's Schedule
              </h3>
              <DayTimeline
                raceDate={raceDate}
                events={timelineEvents.filter((e) => isSameDay(e.start, raceDate))}
                onSelectEvent={(event) => {
                  if (event.raceId) setSelectedRaceId(event.raceId);
                }}
              />
            </div>
          </div>

          {/* Right column - Warmup & Checklists */}
          <div className="space-y-6">
            {/* Warmup schedule */}
            <div className="bg-ink-raised rounded-xl border border-ink-border p-4">
              <h3 className="font-medium text-ink-bright mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent-copper" />
                Launch Schedule
              </h3>
              <WarmupSchedule
                races={todayRaces}
                config={{ warmupDuration: 45, travelToStartTime: 15 }}
              />
            </div>

            {/* Checklists */}
            <div className="bg-ink-raised rounded-xl border border-ink-border p-4">
              <h3 className="font-medium text-ink-bright mb-4">Pre-Race Checklists</h3>

              {selectedRaceId ? (
                <PreRaceChecklist
                  raceId={selectedRaceId}
                  raceName={todayRaces.find((r) => r.id === selectedRaceId)?.eventName || ''}
                  userRole={userRole}
                  userId={user?.id || ''}
                  userName={user?.name}
                />
              ) : (
                <div className="space-y-2">
                  {todayRaces.slice(0, 5).map((race) => (
                    <button
                      key={race.id}
                      onClick={() => setSelectedRaceId(race.id)}
                      className="w-full text-left"
                    >
                      <ChecklistProgress raceId={race.id} raceName={race.eventName} />
                    </button>
                  ))}
                  {todayRaces.length === 0 && (
                    <p className="text-sm text-ink-muted text-center py-4">
                      No scheduled races for today
                    </p>
                  )}
                </div>
              )}

              {selectedRaceId && (
                <button
                  onClick={() => setSelectedRaceId(null)}
                  className="mt-4 w-full text-sm text-ink-secondary hover:text-ink-bright"
                >
                  View all races
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RaceDayCommandCenter;
