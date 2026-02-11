// src/v2/utils/rrule.ts
// RRULE utilities for calendar recurrence in training sessions

import { RRule, rrulestr, Weekday } from 'rrule';

// ============================================
// DAY MAPPING
// ============================================

const DAY_MAP: Record<string, Weekday> = {
  MO: RRule.MO,
  TU: RRule.TU,
  WE: RRule.WE,
  TH: RRule.TH,
  FR: RRule.FR,
  SA: RRule.SA,
  SU: RRule.SU,
};

const DAY_NAMES: Record<string, string> = {
  MO: 'Monday',
  TU: 'Tuesday',
  WE: 'Wednesday',
  TH: 'Thursday',
  FR: 'Friday',
  SA: 'Saturday',
  SU: 'Sunday',
};

// ============================================
// PARSING
// ============================================

/**
 * Parse an RRULE string into an RRule object
 * @param rruleString - RFC 5545 RRULE string (e.g., "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR")
 * @returns RRule object or null if parsing fails
 */
export function parseRRule(rruleString: string): RRule | null {
  try {
    return rrulestr(rruleString) as RRule;
  } catch {
    return null;
  }
}

// ============================================
// GENERATION
// ============================================

export interface RRuleOptions {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  interval?: number;
  byweekday?: string[]; // ['MO', 'WE', 'FR']
  until?: Date;
  count?: number;
  dtstart: Date;
}

/**
 * Generate an RRULE string from options
 * @param options - Configuration for the recurrence rule
 * @returns RFC 5545 compliant RRULE string
 */
export function generateRRule(options: RRuleOptions): string {
  const freq = {
    DAILY: RRule.DAILY,
    WEEKLY: RRule.WEEKLY,
    MONTHLY: RRule.MONTHLY,
  }[options.freq];

  const byweekday = options.byweekday
    ?.map((day) => DAY_MAP[day.toUpperCase()])
    .filter((d): d is Weekday => d !== undefined);

  const rule = new RRule({
    freq,
    interval: options.interval || 1,
    byweekday: byweekday && byweekday.length > 0 ? byweekday : undefined,
    until: options.until,
    count: options.count,
    dtstart: options.dtstart,
  });

  return rule.toString();
}

// ============================================
// EXPANSION
// ============================================

/**
 * Expand recurrence to get all dates within a range
 * @param rruleString - RRULE string to expand
 * @param startDate - Start of the date range
 * @param endDate - End of the date range
 * @returns Array of dates within the range
 */
export function expandRecurrence(rruleString: string, startDate: Date, endDate: Date): Date[] {
  const rule = parseRRule(rruleString);
  if (!rule) return [];

  return rule.between(startDate, endDate, true);
}

/**
 * Get next N occurrences from now
 * @param rruleString - RRULE string
 * @param count - Number of occurrences to retrieve
 * @returns Array of upcoming dates
 */
export function getNextOccurrences(rruleString: string, count: number): Date[] {
  const rule = parseRRule(rruleString);
  if (!rule) return [];

  return rule.all((_, i) => i < count);
}

/**
 * Get the next occurrence after a given date
 * @param rruleString - RRULE string
 * @param after - Date to start searching from (defaults to now)
 * @returns Next occurrence date or null
 */
export function getNextOccurrence(rruleString: string, after: Date = new Date()): Date | null {
  const rule = parseRRule(rruleString);
  if (!rule) return null;

  return rule.after(after, false);
}

// ============================================
// FORMATTING
// ============================================

/**
 * Format RRULE for human-readable display using rrule.js built-in
 * @param rruleString - RRULE string
 * @returns Human-readable description
 */
export function formatRRule(rruleString: string): string {
  const rule = parseRRule(rruleString);
  if (!rule) return '';

  return rule.toText();
}

/**
 * Format RRULE with custom, cleaner output for rowing context
 * @param rruleString - RRULE string
 * @returns Concise description (e.g., "Every Mon, Wed, Fri")
 */
export function formatRRuleShort(rruleString: string): string {
  const rule = parseRRule(rruleString);
  if (!rule) return '';

  const options = rule.origOptions;

  // Handle weekly with specific days
  if (options.freq === RRule.WEEKLY && options.byweekday) {
    const days = (options.byweekday as Weekday[])
      .map((d) => {
        const dayCode = d.toString().toUpperCase().slice(0, 2);
        return DAY_NAMES[dayCode]?.slice(0, 3) || dayCode;
      })
      .join(', ');

    const interval =
      options.interval && options.interval > 1 ? `Every ${options.interval} weeks on ` : 'Every ';

    return `${interval}${days}`;
  }

  // Handle daily
  if (options.freq === RRule.DAILY) {
    const interval =
      options.interval && options.interval > 1 ? `Every ${options.interval} days` : 'Daily';
    return interval;
  }

  // Handle monthly
  if (options.freq === RRule.MONTHLY) {
    const interval =
      options.interval && options.interval > 1 ? `Every ${options.interval} months` : 'Monthly';
    return interval;
  }

  // Fallback to built-in formatting
  return rule.toText();
}

// ============================================
// VALIDATION
// ============================================

/**
 * Check if an RRULE string is valid
 * @param rruleString - RRULE string to validate
 * @returns Boolean indicating validity
 */
export function isValidRRule(rruleString: string): boolean {
  return parseRRule(rruleString) !== null;
}

// ============================================
// COMMON PRESETS
// ============================================

/**
 * Generate common rowing schedule presets
 */
export const rrulePresets = {
  /**
   * Weekday mornings (M-F)
   */
  weekdayMornings: (dtstart: Date): string =>
    generateRRule({
      freq: 'WEEKLY',
      byweekday: ['MO', 'TU', 'WE', 'TH', 'FR'],
      dtstart,
    }),

  /**
   * MWF schedule
   */
  mondayWednesdayFriday: (dtstart: Date): string =>
    generateRRule({
      freq: 'WEEKLY',
      byweekday: ['MO', 'WE', 'FR'],
      dtstart,
    }),

  /**
   * TuTh schedule
   */
  tuesdayThursday: (dtstart: Date): string =>
    generateRRule({
      freq: 'WEEKLY',
      byweekday: ['TU', 'TH'],
      dtstart,
    }),

  /**
   * Daily practice
   */
  daily: (dtstart: Date): string =>
    generateRRule({
      freq: 'DAILY',
      dtstart,
    }),

  /**
   * Weekly (same day each week)
   */
  weekly: (dtstart: Date): string =>
    generateRRule({
      freq: 'WEEKLY',
      dtstart,
    }),
};
