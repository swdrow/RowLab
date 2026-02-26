import type { ReactNode } from 'react';

interface DataValueProps {
  /** The value to display. Null/undefined/empty renders as em dash. */
  value: string | number | null | undefined;
  /** Optional formatter for numeric values */
  format?: (v: number) => string;
  /** Additional CSS classes */
  className?: string;
  /** Font override. Defaults to 'mono' for numbers, 'body' for strings. */
  font?: 'mono' | 'body' | 'display';
  /** Optional suffix (e.g., units like "m", "/500m") rendered in body font */
  suffix?: ReactNode;
  /** Override the em dash placeholder for null values */
  placeholder?: string;
}

const DASH = '\u2014'; // em dash

export function DataValue({
  value,
  format,
  className = '',
  font,
  suffix,
  placeholder,
}: DataValueProps) {
  // Null/undefined/empty string -> em dash in faint
  if (value == null || value === '') {
    return <span className={`text-text-faint font-mono ${className}`}>{placeholder ?? DASH}</span>;
  }

  // Zero is valid — render it (callers pass null if 0 should show as em dash)
  const isNumber = typeof value === 'number';
  const display = isNumber && format ? format(value) : String(value);
  const defaultFont = isNumber ? 'mono' : (font ?? 'body');
  const resolvedFont = font ?? defaultFont;
  const fontClass =
    resolvedFont === 'mono'
      ? 'font-mono tabular-nums'
      : resolvedFont === 'display'
        ? 'font-display'
        : '';

  return (
    <span className={`${fontClass} ${className}`}>
      {display}
      {suffix && <span className="font-sans">{suffix}</span>}
    </span>
  );
}
