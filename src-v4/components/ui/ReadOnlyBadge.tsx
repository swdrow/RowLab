/**
 * ReadOnlyBadge: shows a "View Only" indicator for athlete read-only access.
 *
 * Used by coach tool pages when usePermissions().isReadOnly(tool) returns true.
 * Designed to sit in the page header area (top-right).
 * Updated to use new design system surface/border/text tokens.
 */

interface ReadOnlyBadgeProps {
  className?: string;
}

export function ReadOnlyBadge({ className = '' }: ReadOnlyBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-[var(--radius-sm)]
        bg-void-raised px-2.5 py-1
        text-xs font-medium text-text-faint
        border border-edge-default
        select-none
        ${className}
      `.trim()}
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
      </svg>
      View Only
    </span>
  );
}
