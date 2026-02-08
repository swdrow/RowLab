/**
 * BoatTimeEntry - Specialized time input for boat finish times
 *
 * Features:
 * - Uses SegmentedTimeInput for stopwatch-style entry
 * - Converts to/from total seconds for form state
 * - Validates and displays errors
 */

import {
  SegmentedTimeInput,
  toSeconds,
  fromSeconds,
  type TimeSegments,
} from './SegmentedTimeInput';

interface BoatTimeEntryProps {
  value: string;
  onChange: (seconds: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

/**
 * Parse time string to seconds (backward compatibility)
 */
function parseTimeInput(input: string): number | null {
  if (!input || input.trim() === '') return null;

  // Try MM:SS.s or MM:SS format
  const colonMatch = input.match(/^(\d+):(\d{1,2}(?:\.\d+)?)$/);
  if (colonMatch) {
    const mins = parseInt(colonMatch[1], 10);
    const secs = parseFloat(colonMatch[2]);
    if (secs >= 60) return null; // Invalid seconds
    return mins * 60 + secs;
  }

  // Try plain seconds
  const num = parseFloat(input);
  if (!isNaN(num) && num > 0) return num;

  return null;
}

export function BoatTimeEntry({
  value,
  onChange,
  placeholder = 'M:SS.s',
  disabled = false,
  error,
}: BoatTimeEntryProps) {
  // Parse value to seconds
  const seconds = parseTimeInput(value);

  const handleChange = (segments: TimeSegments) => {
    const totalSeconds = toSeconds(segments);
    // Only emit non-zero values
    onChange(totalSeconds > 0 ? totalSeconds : null);
  };

  return (
    <div className="flex flex-col">
      <SegmentedTimeInput
        value={seconds}
        onChange={handleChange}
        disabled={disabled}
        className={error ? 'ring-2 ring-red-500' : ''}
      />
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
}
