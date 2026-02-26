/**
 * Conditional team context section at the bottom of the dashboard.
 * Shows upcoming events and team notices when user belongs to a team.
 * Returns null when no team context — callers don't need conditional rendering.
 * Ref: DASH-06 (team notices), DASH-07 (team context).
 */

import { motion } from 'motion/react';
import { IconUsers, IconCalendarDays, IconMessageCircle } from '@/components/icons';
import { slideUp } from '@/lib/animations';
import { Card } from '@/components/ui/Card';
import { formatRelativeDate } from '@/lib/format';
import type { TeamContextData } from '../types';

interface TeamContextProps {
  teamContext: TeamContextData | null;
  className?: string;
}

export function TeamContext({ teamContext, className = '' }: TeamContextProps) {
  if (teamContext == null) return null;

  const hasEvents = teamContext.upcomingEvents.length > 0;
  const hasNotices = teamContext.notices.length > 0;

  if (!hasEvents && !hasNotices) return null;

  return (
    <motion.section {...slideUp} className={className} aria-label={`${teamContext.teamName} team`}>
      <Card padding="md" className="border-t-2 border-accent-teal/30">
        {/* Team header */}
        <div className="flex items-center gap-2 mb-4">
          <IconUsers width={18} height={18} className="text-accent-teal" aria-hidden="true" />
          <h2 className="text-lg font-display font-semibold text-text-bright">
            {teamContext.teamName}
          </h2>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Upcoming Events */}
          {hasEvents && (
            <div>
              <h3 className="text-sm font-display font-medium text-text-dim mb-3 flex items-center gap-1.5">
                <IconCalendarDays width={14} height={14} aria-hidden="true" />
                Upcoming Events
              </h3>
              <ul className="space-y-2">
                {teamContext.upcomingEvents.map((event) => (
                  <li key={event.id} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-teal mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-sm text-text-bright block truncate">{event.title}</span>
                      <span className="text-xs text-accent-ivory">
                        {formatRelativeDate(event.date)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Team Notices */}
          {hasNotices && (
            <div>
              <h3 className="text-sm font-display font-medium text-text-dim mb-3 flex items-center gap-1.5">
                <IconMessageCircle width={14} height={14} aria-hidden="true" />
                Notices
              </h3>
              <ul className="space-y-2">
                {teamContext.notices.map((notice) => (
                  <li key={notice.id} className="text-sm">
                    <p className="text-text-bright">{notice.message}</p>
                    <span className="text-xs text-accent-ivory">
                      {notice.author} {'\u00b7'} {formatRelativeDate(notice.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>
    </motion.section>
  );
}
