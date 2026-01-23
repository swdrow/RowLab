import { useAdaptiveHeadline, type HeadlineType } from '../../hooks/useAdaptiveHeadline';
import { Link } from 'react-router-dom';

interface HeadlineWidgetProps {
  className?: string;
}

function getHeadlineIcon(type: HeadlineType): string {
  switch (type) {
    case 'pb-achieved': return '🏆';
    case 'streak-celebration': return '🔥';
    case 'workout-due': return '⏰';
    case 'goal-progress': return '🎯';
    case 'rest-day-reminder': return '😴';
    case 'welcome-back':
    default: return '👋';
  }
}

export function HeadlineWidget({ className = '' }: HeadlineWidgetProps) {
  const { headline, isLoading, error } = useAdaptiveHeadline();

  if (isLoading) {
    return (
      <div className={`rounded-xl bg-card-bg p-8 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-surface-tertiary rounded mb-2" />
          <div className="h-5 w-64 bg-surface-tertiary rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-xl bg-card-bg p-8 ${className}`}>
        <h2 className="text-2xl font-bold text-text-primary">
          {getHeadlineIcon('welcome-back')} Welcome
        </h2>
        <p className="text-text-secondary mt-1">Ready to get started?</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl bg-card-bg p-8 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">
            <span className="mr-2">{getHeadlineIcon(headline.type)}</span>
            {headline.title}
          </h2>
          {headline.subtitle && (
            <p className="text-text-secondary mt-1 text-lg">
              {headline.subtitle}
            </p>
          )}
        </div>
        {headline.cta && (
          <Link
            to={headline.cta.href}
            className="shrink-0 px-4 py-2 rounded-lg bg-action-primary text-text-primary hover:bg-action-primary-hover transition-colors font-medium"
          >
            {headline.cta.label}
          </Link>
        )}
      </div>
    </div>
  );
}
