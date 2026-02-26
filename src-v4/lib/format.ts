/**
 * Shared formatting utilities for erg data display.
 *
 * Conventions:
 * - Pace is stored as tenths of seconds per 500m (e.g., 1146 = 1:54.6)
 * - Duration is in seconds
 * - Distance is in meters
 * - All functions handle null/undefined gracefully by returning '—'
 */

const DASH = '\u2014'; // em dash

/**
 * Format erg pace from tenths of seconds per 500m to display string.
 * DB always stores pace as tenths/500m. For bike erg display, pass
 * machineType='bikerg' to auto-convert to /1000m basis (×2).
 * @example formatPace(1146) → "1:54.6"
 * @example formatPace(1200) → "2:00.0"
 * @example formatPace(556, 'bikerg') → "1:51.2" (556 × 2 = 1112 tenths/1000m)
 */
export function formatPace(tenths: number | null | undefined, machineType?: string | null): string {
  if (tenths == null || tenths <= 0) return DASH;
  // Bike erg: DB stores /500m, display needs /1000m
  const adjusted = machineType === 'bikerg' ? tenths * 2 : tenths;
  const totalSeconds = adjusted / 10;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const wholeSeconds = Math.floor(seconds);
  const fraction = Math.round((seconds - wholeSeconds) * 10);
  return `${minutes}:${String(wholeSeconds).padStart(2, '0')}.${fraction}`;
}

/**
 * Format duration from seconds to display string.
 * Sub-hour: "7:42", hour+: "1:01:02"
 * @example formatDuration(462) → "7:42"
 * @example formatDuration(3662) → "1:01:02"
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0) return DASH;
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format distance with smart units.
 * @example formatDistance(2000) → "2k"
 * @example formatDistance(500) → "500m"
 * @example formatDistance(21097) → "HM"
 * @example formatDistance(2000, false) → "2,000m"
 */
export function formatDistance(meters: number | null | undefined, short = true): string {
  if (meters == null || meters < 0) return DASH;

  if (short) {
    // Known race distances
    if (meters === 21_097) return 'HM';
    if (meters === 42_195) return 'FM';

    // Clean thousands → "Xk"
    if (meters >= 1000 && meters % 1000 === 0) {
      return `${meters / 1000}k`;
    }

    // Sub-thousand or non-round thousands
    if (meters < 1000) return `${meters}m`;

    // Non-round > 1000 (e.g. 1500) → "1.5k" if clean, else "1,500m"
    const km = meters / 1000;
    if (Number.isInteger(km * 10) && km < 100) {
      return `${km}k`;
    }
    return `${formatNumber(meters)}m`;
  }

  return `${formatNumber(meters)}m`;
}

/**
 * Format date as relative time for dashboard display.
 * @example formatRelativeDate('2026-02-13T...') → "Today" (if today)
 * @example formatRelativeDate('2026-02-12T...') → "Yesterday"
 * @example formatRelativeDate('2026-02-10T...') → "3 days ago"
 * @example formatRelativeDate('2026-01-15T...') → "Jan 15"
 * @example formatRelativeDate('2025-01-15T...') → "Jan 15, 2025"
 */
export function formatRelativeDate(isoDate: string | null | undefined): string {
  if (!isoDate) return DASH;

  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return DASH;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const month = months[date.getMonth()];
  const day = date.getDate();

  if (date.getFullYear() !== now.getFullYear()) {
    return `${month} ${day}, ${date.getFullYear()}`;
  }

  return `${month} ${day}`;
}

/**
 * Format erg test time from tenths of seconds to display string with decimal.
 * Unlike formatDuration, this handles tenths-of-seconds input and shows .X precision.
 * @example formatErgTime(3906) → "6:30.6"  (2k test time)
 * @example formatErgTime(878)  → "1:27.8"  (500m time)
 * @example formatErgTime(11460) → "19:06.0" (5k time)
 */
export function formatErgTime(tenths: number | null | undefined): string {
  if (tenths == null || tenths < 0) return DASH;
  const totalSeconds = tenths / 10;
  const minutes = Math.floor(totalSeconds / 60);
  const remainderSeconds = totalSeconds - minutes * 60;
  const wholeSeconds = Math.floor(remainderSeconds);
  const fraction = Math.round((remainderSeconds - wholeSeconds) * 10);
  return `${minutes}:${String(wholeSeconds).padStart(2, '0')}.${fraction}`;
}

/**
 * Format large numbers with locale-aware separators.
 * @example formatNumber(245000) → "245,000"
 */
export function formatNumber(value: number | null | undefined): string {
  if (value == null) return DASH;
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Format seconds to human-readable hours.
 * @example formatHours(7200) → "2.0 hrs"
 * @example formatHours(5400) → "1.5 hrs"
 */
export function formatHours(seconds: number | null | undefined): string {
  if (seconds == null) return DASH;
  const hours = seconds / 3600;
  return `${hours.toFixed(1)} hrs`;
}

/**
 * Format ISO date as short absolute date: "Feb 23, 2026".
 * @example formatDate('2026-02-23T10:00:00Z') → "Feb 23, 2026"
 */
export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return DASH;
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return DASH;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format ISO date as long date with weekday: "Monday, February 23, 2026".
 * @example formatLongDate('2026-02-23') → "Monday, February 23, 2026"
 */
export function formatLongDate(isoDate: string | null | undefined): string {
  if (!isoDate) return DASH;
  // Append T00:00:00 for date-only strings to avoid timezone shift
  const normalized = isoDate.includes('T') ? isoDate : `${isoDate}T00:00:00`;
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return DASH;
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date for HTML date input value: "YYYY-MM-DD".
 * @example formatDateForInput(new Date('2026-02-23')) → "2026-02-23"
 * @example formatDateForInput('2026-02-23T10:00:00Z') → "2026-02-23"
 */
export function formatDateForInput(date: Date | string | null | undefined): string {
  if (date == null) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}
