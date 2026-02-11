import { motion } from 'framer-motion';
import { Calendar, Users, Clock } from 'lucide-react';
import { useHostAthleteVisits } from '@v2/hooks/useRecruitVisits';
import { useAuth } from '../../../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface HostVisitsWidgetProps {
  athleteId?: string;
  className?: string;
}

/**
 * HostVisitsWidget - Dashboard widget showing upcoming visits for host athletes
 *
 * Displays upcoming recruit visits where the current athlete is assigned as host.
 * Provides quick links to the recruiting page for full details.
 * Returns null if athlete has no upcoming visits.
 */
export function HostVisitsWidget({ athleteId, className }: HostVisitsWidgetProps) {
  const { user } = useAuth();

  // Use provided athleteId or try to get from user
  // Note: In RowLab, athletes and coaches are in the User model, athleteId might need to be derived
  const effectiveAthleteId = athleteId || user?.id;

  const { visits, isLoading } = useHostAthleteVisits(effectiveAthleteId || null);

  // Don't render if no athlete ID
  if (!effectiveAthleteId) return null;

  // Filter for upcoming scheduled visits
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingVisits = visits.filter((v) => {
    if (v.status !== 'scheduled') return false;
    const visitDate = new Date(v.date);
    return visitDate >= today;
  });

  // Don't render if no upcoming visits
  if (upcomingVisits.length === 0) return null;

  if (isLoading) {
    return (
      <div
        className={`bg-ink-raised rounded-xl border border-white/[0.06] p-4 ${className || ''}`}
      >
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-48 bg-ink-base rounded" />
          <div className="h-16 bg-ink-base rounded" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-ink-raised rounded-xl border border-white/[0.06] p-4 ${className || ''}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-violet-500" />
        <h3 className="font-semibold text-ink-bright">Your Upcoming Hosting Duties</h3>
      </div>

      <div className="space-y-3">
        {upcomingVisits.slice(0, 3).map((visit) => (
          <Link
            key={visit.id}
            to={`/app/recruiting?visit=${visit.id}`}
            className="block p-3 bg-ink-base rounded-lg border border-white/[0.06] hover:border-violet-500/50 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink-bright truncate">{visit.recruitName}</p>
                <div className="flex items-center gap-2 text-sm text-ink-secondary mt-1">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{new Date(visit.date).toLocaleDateString()}</span>
                  <Clock className="w-3.5 h-3.5 ml-2 flex-shrink-0" />
                  <span>
                    {visit.startTime} - {visit.endTime}
                  </span>
                </div>
              </div>
              <span className="text-xs text-violet-500 bg-violet-500/10 px-2 py-1 rounded whitespace-nowrap ml-2">
                {formatDistanceToNow(new Date(visit.date), { addSuffix: true })}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {upcomingVisits.length > 3 && (
        <Link
          to="/app/recruiting"
          className="block text-center text-sm text-violet-500 hover:underline mt-3"
        >
          View all {upcomingVisits.length} visits
        </Link>
      )}
    </motion.div>
  );
}
