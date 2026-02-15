import { useState, useMemo } from 'react';
import { format, differenceInMinutes, isFuture, isPast } from 'date-fns';
import { Anchor, AlertCircle, Edit2, Check, X } from 'lucide-react';
import type { Race, WarmupScheduleItem } from '../../types/regatta';
import {
  calculateWarmupSchedule,
  updateLaunchTime,
  getTimeUntilLaunch,
  WarmupConfig,
} from '../../utils/warmupCalculator';

type WarmupScheduleProps = {
  races: Race[];
  config?: Partial<WarmupConfig>;
  onOverrideLaunchTime?: (raceId: string, newTime: Date) => void;
};

export function WarmupSchedule({
  races,
  config,
  onOverrideLaunchTime,
}: WarmupScheduleProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState('');
  const [overrides, setOverrides] = useState<Record<string, Date>>({});

  // Calculate schedule
  const schedule = useMemo(() => {
    const racesWithTime = races.filter(r => r.scheduledTime);
    const items = calculateWarmupSchedule(
      racesWithTime.map(r => ({
        id: r.id,
        eventName: r.eventName,
        scheduledTime: r.scheduledTime!,
        boatClass: r.boatClass,
      })),
      config
    );

    // Apply overrides
    return items.map(item => {
      const override = overrides[item.raceId];
      if (override) {
        return updateLaunchTime(item, override);
      }
      return item;
    });
  }, [races, config, overrides]);

  const handleEditStart = (item: WarmupScheduleItem) => {
    setEditingId(item.raceId);
    setEditTime(format(item.launchTime, "HH:mm"));
  };

  const handleEditSave = (item: WarmupScheduleItem) => {
    const [hours, minutes] = editTime.split(':').map(Number);
    const newTime = new Date(item.raceTime);
    newTime.setHours(hours ?? 0, minutes ?? 0, 0, 0);

    setOverrides(prev => ({ ...prev, [item.raceId]: newTime }));
    onOverrideLaunchTime?.(item.raceId, newTime);
    setEditingId(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditTime('');
  };

  if (schedule.length === 0) {
    return (
      <div className="text-center py-8 text-txt-secondary">
        <Anchor className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p>No scheduled races with times</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {schedule.map((item) => {
        const isEditing = editingId === item.raceId;
        const isPastLaunch = isPast(item.launchTime);
        const isUpcoming = isFuture(item.launchTime) && differenceInMinutes(item.launchTime, new Date()) <= 30;

        return (
          <div
            key={item.raceId}
            className={`p-4 rounded-lg border transition-colors ${
              isPastLaunch
                ? 'bg-surface-sunken border-bdr-subtle opacity-60'
                : isUpcoming
                ? 'bg-accent-primary/5 border-accent-primary/30'
                : 'bg-surface-elevated border-bdr-default'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-txt-primary">{item.raceName}</h4>
                  {item.isOverride && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600">
                      Modified
                    </span>
                  )}
                </div>

                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                  {/* Launch time */}
                  <div>
                    <p className="text-xs text-txt-tertiary uppercase tracking-wide">Launch</p>
                    {isEditing ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="time"
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          className="px-2 py-1 text-sm bg-surface-default border border-bdr-default rounded
                                   focus:outline-none focus:ring-2 focus:ring-accent-primary"
                        />
                        <button
                          onClick={() => handleEditSave(item)}
                          className="p-1 rounded hover:bg-surface-hover text-green-500"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="p-1 rounded hover:bg-surface-hover text-txt-tertiary"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-medium text-txt-primary font-mono">
                          {format(item.launchTime, 'h:mm a')}
                        </p>
                        {!isPastLaunch && (
                          <button
                            onClick={() => handleEditStart(item)}
                            className="p-1 rounded hover:bg-surface-hover text-txt-tertiary opacity-0 group-hover:opacity-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Race time */}
                  <div>
                    <p className="text-xs text-txt-tertiary uppercase tracking-wide">Race</p>
                    <p className="font-medium text-txt-primary font-mono mt-1">
                      {format(item.raceTime, 'h:mm a')}
                    </p>
                  </div>
                </div>

                {/* Warning */}
                {item.warning && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {item.warning}
                  </div>
                )}
              </div>

              {/* Time until launch */}
              {!isPastLaunch && (
                <div className="text-right">
                  <p className="text-xs text-txt-tertiary">In</p>
                  <p className={`text-lg font-bold ${isUpcoming ? 'text-accent-primary' : 'text-txt-primary'}`}>
                    {getTimeUntilLaunch(item.launchTime)}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Compact version for sidebar
export function WarmupScheduleCompact({ races, config }: Omit<WarmupScheduleProps, 'onOverrideLaunchTime'>) {
  const schedule = useMemo(() => {
    const racesWithTime = races.filter(r => r.scheduledTime);
    return calculateWarmupSchedule(
      racesWithTime.map(r => ({
        id: r.id,
        eventName: r.eventName,
        scheduledTime: r.scheduledTime!,
        boatClass: r.boatClass,
      })),
      config
    ).filter(item => isFuture(item.launchTime));
  }, [races, config]);

  if (schedule.length === 0) return null;

  return (
    <div className="space-y-1">
      {schedule.slice(0, 3).map((item) => (
        <div
          key={item.raceId}
          className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-surface-elevated"
        >
          <div className="truncate">
            <span className="font-medium text-txt-primary">{item.raceName}</span>
            <span className="text-txt-tertiary ml-2">{format(item.launchTime, 'h:mm')}</span>
          </div>
          <span className="text-xs font-medium text-accent-primary">
            {getTimeUntilLaunch(item.launchTime)}
          </span>
        </div>
      ))}
    </div>
  );
}
