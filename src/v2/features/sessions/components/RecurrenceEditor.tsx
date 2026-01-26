import { useState, useEffect } from 'react';
import { generateRRule, formatRRule, type RRuleOptions } from '../../../utils/rrule';

type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';
type Weekday = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';

interface RecurrenceEditorProps {
  value?: string; // RRULE string
  onChange: (rrule: string | undefined) => void;
  startDate: Date;
}

const WEEKDAYS: { value: Weekday; label: string }[] = [
  { value: 'MO', label: 'Mon' },
  { value: 'TU', label: 'Tue' },
  { value: 'WE', label: 'Wed' },
  { value: 'TH', label: 'Thu' },
  { value: 'FR', label: 'Fri' },
  { value: 'SA', label: 'Sat' },
  { value: 'SU', label: 'Sun' },
];

export function RecurrenceEditor({ value, onChange, startDate }: RecurrenceEditorProps) {
  const [enabled, setEnabled] = useState(!!value);
  const [freq, setFreq] = useState<Frequency>('WEEKLY');
  const [interval, setInterval] = useState(1);
  const [selectedDays, setSelectedDays] = useState<Weekday[]>(['MO', 'WE', 'FR']);
  const [endType, setEndType] = useState<'never' | 'until' | 'count'>('never');
  const [untilDate, setUntilDate] = useState<Date | null>(null);
  const [count, setCount] = useState(10);

  // Generate RRULE when options change
  useEffect(() => {
    if (!enabled) {
      onChange(undefined);
      return;
    }

    const options: RRuleOptions = {
      freq,
      interval,
      dtstart: startDate,
    };

    if (freq === 'WEEKLY' && selectedDays.length > 0) {
      options.byweekday = selectedDays;
    }

    if (endType === 'until' && untilDate) {
      options.until = untilDate;
    } else if (endType === 'count') {
      options.count = count;
    }

    const rrule = generateRRule(options);
    onChange(rrule);
  }, [enabled, freq, interval, selectedDays, endType, untilDate, count, startDate, onChange]);

  // Toggle weekday selection
  const toggleDay = (day: Weekday) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="space-y-4">
      {/* Enable toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="w-4 h-4 rounded border-bdr-default text-accent-primary focus:ring-accent-primary"
        />
        <span className="text-txt-primary">Repeat session</span>
      </label>

      {enabled && (
        <>
          {/* Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-txt-secondary mb-1">Repeats</label>
              <select
                value={freq}
                onChange={(e) => setFreq(e.target.value as Frequency)}
                className="w-full px-3 py-2 rounded-lg bg-surface-default border border-bdr-default
                  text-txt-primary focus:outline-none focus:border-accent-primary"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-txt-secondary mb-1">Every</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={interval}
                  onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                  className="w-20 px-3 py-2 rounded-lg bg-surface-default border border-bdr-default
                    text-txt-primary focus:outline-none focus:border-accent-primary"
                />
                <span className="text-txt-secondary">
                  {freq === 'DAILY' ? 'day(s)' : freq === 'WEEKLY' ? 'week(s)' : 'month(s)'}
                </span>
              </div>
            </div>
          </div>

          {/* Weekday selector (for weekly) */}
          {freq === 'WEEKLY' && (
            <div>
              <label className="block text-sm text-txt-secondary mb-2">On days</label>
              <div className="flex gap-2">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedDays.includes(day.value)
                        ? 'bg-accent-primary text-white'
                        : 'bg-surface-default border border-bdr-default text-txt-secondary hover:text-txt-primary'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* End condition */}
          <div>
            <label className="block text-sm text-txt-secondary mb-2">Ends</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === 'never'}
                  onChange={() => setEndType('never')}
                  className="text-accent-primary focus:ring-accent-primary"
                />
                <span className="text-txt-primary">Never</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === 'until'}
                  onChange={() => setEndType('until')}
                  className="text-accent-primary focus:ring-accent-primary"
                />
                <span className="text-txt-primary">On date</span>
                {endType === 'until' && (
                  <input
                    type="date"
                    value={untilDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setUntilDate(e.target.value ? new Date(e.target.value) : null)}
                    className="px-2 py-1 rounded-lg bg-surface-default border border-bdr-default
                      text-txt-primary focus:outline-none focus:border-accent-primary"
                  />
                )}
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === 'count'}
                  onChange={() => setEndType('count')}
                  className="text-accent-primary focus:ring-accent-primary"
                />
                <span className="text-txt-primary">After</span>
                {endType === 'count' && (
                  <>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={count}
                      onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                      className="w-20 px-2 py-1 rounded-lg bg-surface-default border border-bdr-default
                        text-txt-primary focus:outline-none focus:border-accent-primary"
                    />
                    <span className="text-txt-secondary">occurrences</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Preview */}
          {value && (
            <div className="p-3 rounded-lg bg-surface-default border border-bdr-default">
              <div className="text-xs text-txt-muted mb-1">Preview</div>
              <div className="text-sm text-txt-primary">{formatRRule(value)}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
