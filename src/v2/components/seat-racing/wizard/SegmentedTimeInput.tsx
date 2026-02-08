/**
 * SegmentedTimeInput - Stopwatch-style time entry with auto-tab
 *
 * Features:
 * - Three separate fields: MM:SS.T
 * - Auto-tab between fields when max length reached
 * - Paste handling for "1:23.4" format strings
 * - Backspace moves to previous field when empty
 * - Bidirectional conversion to/from total seconds
 */

import React, { useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';

export interface TimeSegments {
  minutes: number;
  seconds: number;
  tenths: number;
}

interface SegmentedTimeInputProps {
  value: TimeSegments | number | null;
  onChange: (value: TimeSegments) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Convert time segments to total seconds
 */
export function toSeconds(segments: TimeSegments): number {
  return segments.minutes * 60 + segments.seconds + segments.tenths / 10;
}

/**
 * Convert total seconds to time segments
 */
export function fromSeconds(totalSeconds: number): TimeSegments {
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  const seconds = Math.floor(remainingSeconds);
  const tenths = Math.round((remainingSeconds - seconds) * 10);

  return { minutes, seconds, tenths };
}

/**
 * Parse pasted time string into segments
 * Supports: "1:23.4", "1:23", "83.4", "83"
 */
function parseTimeString(input: string): TimeSegments | null {
  const trimmed = input.trim();

  // Try MM:SS.T or MM:SS format
  const colonMatch = trimmed.match(/^(\d+):(\d{1,2})(?:\.(\d))?$/);
  if (colonMatch) {
    const minutes = parseInt(colonMatch[1], 10);
    const seconds = parseInt(colonMatch[2], 10);
    const tenths = colonMatch[3] ? parseInt(colonMatch[3], 10) : 0;

    if (seconds >= 60) return null; // Invalid seconds
    return { minutes, seconds, tenths };
  }

  // Try SS.T or SS format (plain seconds)
  const secondsMatch = trimmed.match(/^(\d+)(?:\.(\d))?$/);
  if (secondsMatch) {
    const totalSecs = parseFloat(trimmed);
    return fromSeconds(totalSecs);
  }

  return null;
}

export function SegmentedTimeInput({
  value,
  onChange,
  className = '',
  disabled = false,
}: SegmentedTimeInputProps) {
  const minutesRef = useRef<HTMLInputElement>(null);
  const secondsRef = useRef<HTMLInputElement>(null);
  const tenthsRef = useRef<HTMLInputElement>(null);

  // Convert value to segments
  const segments: TimeSegments =
    value === null || value === undefined
      ? { minutes: 0, seconds: 0, tenths: 0 }
      : typeof value === 'number'
        ? fromSeconds(value)
        : value;

  // Internal state for display values
  const [minutesDisplay, setMinutesDisplay] = React.useState(
    segments.minutes.toString().padStart(2, '0')
  );
  const [secondsDisplay, setSecondsDisplay] = React.useState(
    segments.seconds.toString().padStart(2, '0')
  );
  const [tenthsDisplay, setTenthsDisplay] = React.useState(segments.tenths.toString());

  // Update display values when external value changes
  useEffect(() => {
    setMinutesDisplay(segments.minutes.toString().padStart(2, '0'));
    setSecondsDisplay(segments.seconds.toString().padStart(2, '0'));
    setTenthsDisplay(segments.tenths.toString());
  }, [segments.minutes, segments.seconds, segments.tenths]);

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setMinutesDisplay(val);

    const minutes = val === '' ? 0 : parseInt(val, 10);
    onChange({ ...segments, minutes });

    // Auto-tab when 2 chars entered
    if (val.length === 2) {
      secondsRef.current?.focus();
    }
  };

  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setSecondsDisplay(val);

    let seconds = val === '' ? 0 : parseInt(val, 10);
    // Cap seconds at 59
    if (seconds > 59) seconds = 59;

    onChange({ ...segments, seconds });

    // Auto-tab when 2 chars entered
    if (val.length === 2) {
      tenthsRef.current?.focus();
    }
  };

  const handleTenthsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 1);
    setTenthsDisplay(val);

    const tenths = val === '' ? 0 : parseInt(val, 10);
    onChange({ ...segments, tenths });
  };

  const handleKeyDown =
    (field: 'minutes' | 'seconds' | 'tenths') => (e: KeyboardEvent<HTMLInputElement>) => {
      // Backspace on empty field: move to previous field
      if (e.key === 'Backspace') {
        const input = e.currentTarget;
        if (input.value === '' || input.selectionStart === 0) {
          if (field === 'seconds') {
            e.preventDefault();
            minutesRef.current?.focus();
          } else if (field === 'tenths') {
            e.preventDefault();
            secondsRef.current?.focus();
          }
        }
      }
    };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const parsed = parseTimeString(pastedText);

    if (parsed) {
      setMinutesDisplay(parsed.minutes.toString().padStart(2, '0'));
      setSecondsDisplay(parsed.seconds.toString().padStart(2, '0'));
      setTenthsDisplay(parsed.tenths.toString());
      onChange(parsed);

      // Focus the tenths field after paste
      tenthsRef.current?.focus();
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`} onPaste={handlePaste}>
      {/* Minutes field */}
      <input
        ref={minutesRef}
        type="text"
        inputMode="numeric"
        value={minutesDisplay}
        onChange={handleMinutesChange}
        onKeyDown={handleKeyDown('minutes')}
        maxLength={2}
        disabled={disabled}
        className="w-12 px-2 py-1.5 text-center text-lg font-mono bg-bg-raised border border-bdr-default rounded-md focus:outline-none focus:ring-2 focus:ring-data-good transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-txt-primary"
        placeholder="00"
      />

      {/* Separator */}
      <span className="text-txt-secondary font-mono text-lg">:</span>

      {/* Seconds field */}
      <input
        ref={secondsRef}
        type="text"
        inputMode="numeric"
        value={secondsDisplay}
        onChange={handleSecondsChange}
        onKeyDown={handleKeyDown('seconds')}
        maxLength={2}
        disabled={disabled}
        className="w-12 px-2 py-1.5 text-center text-lg font-mono bg-bg-raised border border-bdr-default rounded-md focus:outline-none focus:ring-2 focus:ring-data-good transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-txt-primary"
        placeholder="00"
      />

      {/* Separator */}
      <span className="text-txt-secondary font-mono text-lg">.</span>

      {/* Tenths field */}
      <input
        ref={tenthsRef}
        type="text"
        inputMode="numeric"
        value={tenthsDisplay}
        onChange={handleTenthsChange}
        onKeyDown={handleKeyDown('tenths')}
        maxLength={1}
        disabled={disabled}
        className="w-8 px-2 py-1.5 text-center text-lg font-mono bg-bg-raised border border-bdr-default rounded-md focus:outline-none focus:ring-2 focus:ring-data-good transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-txt-primary"
        placeholder="0"
      />
    </div>
  );
}
