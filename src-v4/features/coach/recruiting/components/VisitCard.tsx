/**
 * VisitCard: displays a single recruit visit in the list.
 *
 * Shows recruit name, date, status badge, school, and notes preview.
 * Clickable to open detail/edit view.
 */

import { format, parseISO } from 'date-fns';

import { Card } from '@/components/ui/Card';
import type { RecruitVisit, VisitStatus } from '../types';
import { IconCalendar, IconFileText, IconMapPin } from '@/components/icons';

interface VisitCardProps {
  visit: RecruitVisit;
  onClick: () => void;
}

const statusStyles: Record<VisitStatus, { bg: string; text: string; label: string }> = {
  scheduled: { bg: 'bg-data-good/15', text: 'text-data-good', label: 'Scheduled' },
  completed: { bg: 'bg-accent-teal/15', text: 'text-accent-teal', label: 'Completed' },
  cancelled: { bg: 'bg-accent-coral/15', text: 'text-accent-coral', label: 'Cancelled' },
};

export function VisitCard({ visit, onClick }: VisitCardProps) {
  const status = statusStyles[visit.status] ?? statusStyles.scheduled;

  const formattedDate = (() => {
    try {
      return format(parseISO(visit.date), 'MMM d, yyyy');
    } catch {
      return visit.date;
    }
  })();

  return (
    <Card padding="md" className="cursor-pointer" as="article">
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left"
        aria-label={`View visit for ${visit.recruitName}`}
      >
        {/* Header: name + status */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-text-bright font-display font-medium text-sm truncate">
            {visit.recruitName}
          </h3>
          <span
            className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${status.bg} ${status.text}`}
          >
            {status.label}
          </span>
        </div>

        {/* Meta row */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-dim">
          <span className="inline-flex items-center gap-1">
            <IconCalendar className="h-3.5 w-3.5" aria-hidden="true" />
            {formattedDate}
            {visit.startTime && ` at ${visit.startTime}`}
          </span>
          {visit.recruitSchool && (
            <span className="inline-flex items-center gap-1">
              <IconMapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {visit.recruitSchool}
            </span>
          )}
        </div>

        {/* Notes preview */}
        {visit.notes && (
          <div className="mt-2 flex items-start gap-1.5 text-xs text-text-faint">
            <IconFileText className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
            <p className="line-clamp-2">{visit.notes}</p>
          </div>
        )}
      </button>
    </Card>
  );
}
