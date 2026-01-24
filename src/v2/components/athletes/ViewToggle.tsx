export type ViewMode = 'grid' | 'list';

export interface ViewToggleProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ view, onChange, className = '' }: ViewToggleProps) {
  return (
    <div className={`inline-flex rounded-lg border border-bdr-default bg-bg-surface ${className}`}>
      <button
        onClick={() => onChange('grid')}
        className={`
          px-3 py-1.5 text-sm font-medium rounded-l-lg transition-colors
          ${
            view === 'grid'
              ? 'bg-bg-active text-txt-primary'
              : 'text-txt-secondary hover:text-txt-primary hover:bg-bg-hover'
          }
        `}
        aria-label="Grid view"
        aria-pressed={view === 'grid'}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      </button>
      <button
        onClick={() => onChange('list')}
        className={`
          px-3 py-1.5 text-sm font-medium rounded-r-lg transition-colors
          ${
            view === 'list'
              ? 'bg-bg-active text-txt-primary'
              : 'text-txt-secondary hover:text-txt-primary hover:bg-bg-hover'
          }
        `}
        aria-label="List view"
        aria-pressed={view === 'list'}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </div>
  );
}

export default ViewToggle;
