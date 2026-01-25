import { useState, useEffect, useMemo } from 'react';
import { format, differenceInMinutes, differenceInSeconds, isFuture } from 'date-fns';
import { Flag, MapPin, Users, AlertTriangle } from 'lucide-react';
import type { Race } from '../../types/regatta';

type NextRaceCardProps = {
  races: Race[];
  currentTime?: Date;
};

export function NextRaceCard({ races, currentTime: initialTime }: NextRaceCardProps) {
  const [now, setNow] = useState(initialTime || new Date());

  // Update every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Find next race
  const nextRace = useMemo(() => {
    const upcomingRaces = races
      .filter(r => r.scheduledTime && isFuture(new Date(r.scheduledTime)))
      .sort((a, b) => new Date(a.scheduledTime!).getTime() - new Date(b.scheduledTime!).getTime());
    return upcomingRaces[0] || null;
  }, [races]);

  // Find current race (within 15 min of start or in progress)
  const currentRace = useMemo(() => {
    return races.find(r => {
      if (!r.scheduledTime) return false;
      const raceTime = new Date(r.scheduledTime);
      const minutesAway = differenceInMinutes(raceTime, now);
      return minutesAway <= 15 && minutesAway >= -30; // 15 min before to 30 min after
    });
  }, [races, now]);

  const displayRace = currentRace || nextRace;

  if (!displayRace || !displayRace.scheduledTime) {
    return (
      <div className="bg-surface-elevated rounded-xl p-6 border border-bdr-default text-center">
        <Flag className="w-10 h-10 mx-auto text-txt-tertiary opacity-50" />
        <p className="mt-3 text-txt-secondary">No upcoming races</p>
      </div>
    );
  }

  const raceTime = new Date(displayRace.scheduledTime);
  const minutesUntil = differenceInMinutes(raceTime, now);
  const secondsUntil = differenceInSeconds(raceTime, now);
  const isImminent = minutesUntil <= 15 && minutesUntil > 0;
  const isNow = minutesUntil <= 0 && minutesUntil > -30;

  // Format countdown
  const formatCountdown = () => {
    if (isNow) return 'NOW';
    if (minutesUntil < 60) {
      const mins = Math.floor(secondsUntil / 60);
      const secs = secondsUntil % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    const hours = Math.floor(minutesUntil / 60);
    const mins = minutesUntil % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div
      className={`rounded-xl p-6 border transition-colors ${
        isNow
          ? 'bg-accent-primary text-white border-accent-primary'
          : isImminent
          ? 'bg-amber-500/10 border-amber-500/30'
          : 'bg-surface-elevated border-bdr-default'
      }`}
    >
      {/* Status badge */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            isNow
              ? 'bg-white/20 text-white'
              : isImminent
              ? 'bg-amber-500/20 text-amber-600'
              : 'bg-accent-primary/10 text-accent-primary'
          }`}
        >
          {isNow ? 'IN PROGRESS' : isImminent ? 'IMMINENT' : 'NEXT RACE'}
        </span>

        {isImminent && !isNow && (
          <AlertTriangle className="w-5 h-5 text-amber-500" />
        )}
      </div>

      {/* Countdown */}
      <div className="mb-4">
        <p
          className={`text-4xl font-bold font-mono tracking-tight ${
            isNow ? 'text-white' : isImminent ? 'text-amber-600' : 'text-txt-primary'
          }`}
        >
          {formatCountdown()}
        </p>
        <p className={`text-sm ${isNow ? 'text-white/70' : 'text-txt-secondary'}`}>
          {format(raceTime, 'h:mm a')}
        </p>
      </div>

      {/* Race details */}
      <div className={`space-y-2 ${isNow ? 'text-white/90' : 'text-txt-primary'}`}>
        <h3 className="font-semibold text-lg">{displayRace.eventName}</h3>
        <div className={`flex items-center gap-4 text-sm ${isNow ? 'text-white/70' : 'text-txt-secondary'}`}>
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {displayRace.boatClass}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {displayRace.distanceMeters}m
          </span>
        </div>
      </div>

      {/* Progress to race */}
      {!isNow && minutesUntil <= 60 && (
        <div className="mt-4 pt-4 border-t border-bdr-subtle">
          <div className="flex items-center justify-between text-xs text-txt-tertiary mb-1">
            <span>Time until race</span>
            <span>{minutesUntil} min</span>
          </div>
          <div className="h-1.5 bg-surface-default rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isImminent ? 'bg-amber-500' : 'bg-accent-primary'
              }`}
              style={{ width: `${Math.max(0, 100 - (minutesUntil / 60) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
