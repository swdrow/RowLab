/**
 * Smart Defaults Configuration
 * Phase 27-06: Pre-fill boat types, season dates, and practice times during setup
 *
 * Per CONTEXT.md (ES-03): "User gets smart defaults during setup
 * (pre-fill boat types, season dates)."
 *
 * Reduces friction for first-time users by providing sensible defaults
 * based on common rowing program patterns and current date.
 */

/**
 * Default boat types for new teams
 * Covers most common racing and training boats
 */
export function getDefaultBoatTypes(): string[] {
  return ['8+', '4+', '4x', '2-', '1x'];
}

/**
 * Detect current rowing season and return appropriate date range
 *
 * Seasons:
 * - Fall: September 1 - December 15
 * - Spring: January 15 - May 31
 * - Summer: June 1 - August 31
 */
export function getDefaultSeasonDates(): { start: Date; end: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed (0 = January)

  // Fall season (Sep-Dec)
  if (month >= 8 && month <= 11) {
    // Sep=8, Dec=11
    return {
      start: new Date(year, 8, 1), // Sep 1
      end: new Date(year, 11, 15), // Dec 15
    };
  }

  // Spring season (Jan-May)
  if (month >= 0 && month <= 4) {
    // Jan=0, May=4
    return {
      start: new Date(year, 0, 15), // Jan 15
      end: new Date(year, 4, 31), // May 31
    };
  }

  // Summer season (Jun-Aug)
  return {
    start: new Date(year, 5, 1), // Jun 1
    end: new Date(year, 7, 31), // Aug 31
  };
}

/**
 * Default practice times for morning programs
 * Most collegiate/competitive programs practice early morning
 */
export function getDefaultPracticeTimes(): { time: string; days: string[] } {
  return {
    time: '06:00', // 6:00 AM
    days: ['Monday', 'Wednesday', 'Friday'], // MWF pattern
  };
}

/**
 * Default team settings based on locale/timezone
 * Pre-fills NCAA compliance for US programs
 */
export function getDefaultTeamSettings(): {
  ncaaComplianceEnabled: boolean;
  defaultBoatTypes: string[];
  timezone: string;
} {
  // Detect if US timezone (NCAA programs are US-based)
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const usTimezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'America/Anchorage',
    'Pacific/Honolulu',
    'America/Detroit',
    'America/Indiana',
    'America/Kentucky',
    'America/Boise',
    'America/Juneau',
    'America/Adak',
  ];
  const isUSTimezone = usTimezones.some((tz) => timezone === tz || timezone.startsWith(tz + '/'));

  return {
    ncaaComplianceEnabled: isUSTimezone,
    defaultBoatTypes: getDefaultBoatTypes(),
    timezone,
  };
}

/**
 * Get current season name for display
 */
export function getCurrentSeasonName(): 'Fall' | 'Spring' | 'Summer' {
  const month = new Date().getMonth();

  if (month >= 8 && month <= 11) return 'Fall';
  if (month >= 0 && month <= 4) return 'Spring';
  return 'Summer';
}

/**
 * Format season dates for display
 */
export function formatSeasonDates(start: Date, end: Date): string {
  const formatOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };

  const startStr = start.toLocaleDateString('en-US', formatOptions);
  const endStr = end.toLocaleDateString('en-US', formatOptions);

  return `${startStr} - ${endStr}`;
}

/**
 * Get default session type for onboarding
 * Most teams start with erg testing or practice
 */
export function getDefaultSessionType(): 'ERG' | 'WATER' {
  const month = new Date().getMonth();

  // Indoor season (Nov-Feb): default to ERG
  if (month >= 10 || month <= 1) {
    return 'ERG';
  }

  // Outdoor season: default to WATER
  return 'WATER';
}

/**
 * Get default session duration in minutes
 */
export function getDefaultSessionDuration(): number {
  return 90; // 90 minutes = standard practice length
}

/**
 * Smart defaults summary for onboarding wizard
 * Provides all context in one call for wizard initialization
 */
export function getOnboardingDefaults() {
  const seasonDates = getDefaultSeasonDates();
  const practiceTimes = getDefaultPracticeTimes();
  const teamSettings = getDefaultTeamSettings();

  return {
    boatTypes: getDefaultBoatTypes(),
    season: {
      name: getCurrentSeasonName(),
      start: seasonDates.start,
      end: seasonDates.end,
      formatted: formatSeasonDates(seasonDates.start, seasonDates.end),
    },
    practice: {
      time: practiceTimes.time,
      days: practiceTimes.days,
      type: getDefaultSessionType(),
      duration: getDefaultSessionDuration(),
    },
    team: teamSettings,
  };
}
