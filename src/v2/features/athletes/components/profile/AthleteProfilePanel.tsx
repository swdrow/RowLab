import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { SPRING_CONFIG, SLIDE_PANEL_VARIANTS } from '@v2/utils/animations';
import { useAthleteDetail } from '../../hooks/useAthleteDetail';
import { ProfileHero } from './ProfileHero';
import { ErgSparkline } from './ErgSparkline';
import { AttendanceHeatmap } from './AttendanceHeatmap';
import { QuickActions } from './QuickActions';

// ─── Skeleton Loader ───────────────────────────────────────────────
function ProfilePanelSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Avatar + Name skeleton */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-bg-hover" />
        <div className="space-y-2 flex-1">
          <div className="h-5 w-40 rounded bg-bg-hover" />
          <div className="h-3 w-24 rounded bg-bg-hover" />
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-lg bg-bg-hover h-20" />
        ))}
      </div>

      {/* Sparkline skeleton */}
      <div className="space-y-1.5">
        <div className="h-3 w-20 rounded bg-bg-hover" />
        <div className="h-[80px] rounded-lg bg-bg-hover" />
      </div>

      {/* Heatmap skeleton */}
      <div className="space-y-1.5">
        <div className="h-3 w-20 rounded bg-bg-hover" />
        <div className="h-[120px] rounded-lg bg-bg-hover" />
      </div>

      {/* Actions skeleton */}
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-bg-hover" />
        <div className="flex gap-2">
          <div className="flex-1 h-10 rounded-lg bg-bg-hover" />
          <div className="flex-1 h-10 rounded-lg bg-bg-hover" />
        </div>
      </div>
    </div>
  );
}

// ─── AthleteProfilePanel Component ─────────────────────────────────
export interface AthleteProfilePanelProps {
  athleteId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AthleteProfilePanel({ athleteId, isOpen, onClose }: AthleteProfilePanelProps) {
  const navigate = useNavigate();
  const { athlete, isLoading } = useAthleteDetail(athleteId);

  return (
    <AnimatePresence>
      {isOpen && athleteId && (
        <>
          {/* Backdrop */}
          <motion.div
            key="profile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="profile-panel"
            variants={SLIDE_PANEL_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={SPRING_CONFIG}
            className="
              fixed inset-y-0 right-0 z-50
              w-full max-w-[400px] md:w-[400px]
              bg-bg-surface border-l border-bdr-default
              shadow-2xl flex flex-col
            "
            role="dialog"
            aria-modal="true"
            aria-label="Athlete Profile"
          >
            {/* Close button */}
            <div className="flex justify-end p-3">
              <button
                onClick={onClose}
                className="
                  p-1.5 rounded-md
                  text-txt-tertiary hover:text-txt-primary
                  hover:bg-bg-hover transition-colors
                "
                aria-label="Close profile panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoading || !athlete ? (
                <ProfilePanelSkeleton />
              ) : (
                <div className="px-6 pb-6 space-y-6">
                  {/* 1. Stats Dashboard */}
                  <ProfileHero athlete={athlete} />

                  {/* 2. Erg Sparkline */}
                  <ErgSparkline ergTests={athlete.recentErgTests ?? []} />

                  {/* 3. Attendance Heatmap */}
                  <AttendanceHeatmap
                    attendanceData={athlete.recentAttendance ?? []}
                    streak={athlete.attendanceStreak ?? 0}
                  />

                  {/* 4. Quick Actions */}
                  <QuickActions
                    athleteId={athlete.id}
                    athleteName={`${athlete.firstName} ${athlete.lastName}`}
                  />

                  {/* 5. View Full Profile CTA */}
                  <button
                    onClick={() => {
                      onClose();
                      navigate(`/app/athletes/${athlete.id}`);
                    }}
                    className="
                      w-full flex items-center justify-center gap-2 px-4 py-2.5
                      bg-interactive-primary/10 text-interactive-primary
                      text-sm font-medium rounded-lg
                      border border-interactive-primary/20
                      hover:bg-interactive-primary/20
                      active:scale-[0.98]
                      transition-all
                    "
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Full Profile
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default AthleteProfilePanel;
