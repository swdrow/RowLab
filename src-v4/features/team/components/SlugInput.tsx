/**
 * Slug availability input with debounced validation.
 *
 * Features:
 * - Auto-formats: lowercase, replaces spaces with hyphens, strips invalid chars
 * - Validates: 3-50 chars, alphanumeric + hyphens only
 * - Debounced availability check (400ms) via slugCheckOptions
 * - Visual feedback: pulse shimmer (loading), green check (available), red X (taken)
 * - Preview: shows oarbit.net/team/{slug} below input
 */
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IconCheckCircle, IconXCircle } from '@/components/icons';
import { slugCheckOptions } from '../api';

interface SlugInputProps {
  teamId: string;
  currentSlug: string | null;
  value: string;
  onChange: (slug: string) => void;
  disabled?: boolean;
}

function formatSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 50);
}

export function SlugInput({ teamId, currentSlug, value, onChange, disabled }: SlugInputProps) {
  const [debouncedSlug, setDebouncedSlug] = useState(value);

  // Debounce the slug value for availability check
  useEffect(() => {
    if (value.length < 3) {
      setDebouncedSlug('');
      return;
    }
    const timer = setTimeout(() => setDebouncedSlug(value), 400);
    return () => clearTimeout(timer);
  }, [value]);

  const shouldCheck = debouncedSlug.length >= 3 && debouncedSlug !== currentSlug;

  const { data, isFetching } = useQuery({
    ...slugCheckOptions(teamId, debouncedSlug),
    enabled: shouldCheck,
  });

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(formatSlug(e.target.value));
    },
    [onChange]
  );

  // Determine status indicator
  const showIndicator = value.length >= 3 && value === debouncedSlug;
  const isCurrentSlug = value === currentSlug;
  const isAvailable = isCurrentSlug || data?.available;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="team-slug" className="text-sm font-medium text-text-default">
        Custom URL slug
      </label>
      <div className="relative">
        <input
          id="team-slug"
          type="text"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder="my-team"
          className="h-10 w-full rounded-xl px-3 pr-10 text-sm bg-void-raised text-text-bright border border-edge-default focus:border-accent-teal focus:ring-1 focus:ring-accent/30 focus:outline-none transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
          minLength={3}
          maxLength={50}
        />
        {/* Status indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isFetching && value.length >= 3 && (
            <div className="h-4 w-4 rounded bg-edge-default/50 animate-pulse" />
          )}
          {!isFetching && showIndicator && isAvailable && (
            <IconCheckCircle width={16} height={16} className="text-data-good" />
          )}
          {!isFetching && showIndicator && !isAvailable && !isCurrentSlug && data && (
            <IconXCircle width={16} height={16} className="text-data-poor" />
          )}
        </div>
      </div>
      {/* Availability text */}
      {!isFetching && showIndicator && isAvailable && (
        <span className="text-xs text-data-good">Available</span>
      )}
      {!isFetching && showIndicator && !isAvailable && !isCurrentSlug && data && (
        <span className="text-xs text-data-poor">Already taken</span>
      )}
      {/* URL preview */}
      {value.length >= 3 && (
        <span className="text-xs text-text-faint font-mono">oarbit.net/team/{value}</span>
      )}
    </div>
  );
}
