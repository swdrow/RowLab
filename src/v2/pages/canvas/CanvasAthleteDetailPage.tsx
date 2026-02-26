/**
 * CanvasAthleteDetailPage - Canvas redesign of the Athlete Detail/Profile page
 *
 * Canvas Design System Features:
 * - RuledHeader for section dividers
 * - CanvasChamferPanel for content sections
 * - ScrambleNumber for numeric stats
 * - CanvasConsoleReadout for bottom status bar
 * - Stagger/fadeUp motion variants
 * - NO rounded corners, NO card wrappers, NO badge pills
 *
 * WRAPS existing V2 sub-components (ErgSparkline, AttendanceHeatmap,
 * ActivityTimeline, AthleteEditForm, QuickActions, AchievementsSection)
 * in Canvas styling containers.
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useAthleteDetail } from '../../features/athletes/hooks/useAthleteDetail';
import { useShowGamification } from '../../hooks/useGamificationPreference';
import { ProfileHero } from '../../features/athletes/components/profile/ProfileHero';
import { ErgSparkline } from '../../features/athletes/components/profile/ErgSparkline';
import { AttendanceHeatmap } from '../../features/athletes/components/profile/AttendanceHeatmap';
import { QuickActions } from '../../features/athletes/components/profile/QuickActions';
import { ActivityTimeline } from '../../features/athletes/components/profile/ActivityTimeline';
import { AchievementsSection } from '../../features/athletes/components/profile/AchievementsSection';
import { AthleteEditForm } from '../../features/athletes/components/edit/AthleteEditForm';
import { PinnedBadges } from '../../features/gamification';
import {
  RuledHeader,
  CanvasChamferPanel,
  CanvasConsoleReadout,
  ScrambleNumber,
  CanvasButton,
} from '@v2/components/canvas';

// ============================================
// STAGGER ANIMATION HELPERS
// ============================================

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

// ============================================
// ERG TESTS TABLE (Canvas-styled)
// ============================================

interface ErgTest {
  id: string;
  testType: string;
  time: string;
  testDate: string;
  distance?: number;
}

function CanvasErgTestsTable({ tests }: { tests: ErgTest[] }) {
  if (tests.length === 0) {
    return (
      <div className="py-4 text-center text-xs font-mono text-ink-muted uppercase tracking-wider">
        No erg test records
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="text-left py-2 px-2 text-[10px] font-mono font-medium text-ink-muted uppercase tracking-wider">
              Date
            </th>
            <th className="text-left py-2 px-2 text-[10px] font-mono font-medium text-ink-muted uppercase tracking-wider">
              Type
            </th>
            <th className="text-right py-2 px-2 text-[10px] font-mono font-medium text-ink-muted uppercase tracking-wider">
              Time
            </th>
            <th className="text-right py-2 px-2 text-[10px] font-mono font-medium text-ink-muted uppercase tracking-wider">
              Distance
            </th>
          </tr>
        </thead>
        <tbody>
          {tests.map((test) => (
            <tr
              key={test.id}
              className="border-b border-white/[0.06]/50 hover:bg-ink-hover/50 transition-colors"
            >
              <td className="py-2 px-2 text-ink-secondary text-sm">
                {new Date(test.testDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </td>
              <td className="py-2 px-2 text-ink-bright font-medium text-sm">{test.testType}</td>
              <td className="py-2 px-2 text-ink-bright font-mono text-right tabular-nums text-sm">
                {test.time}
              </td>
              <td className="py-2 px-2 text-ink-secondary text-right tabular-nums text-sm">
                {test.distance ? `${test.distance}m` : '\u2014'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// NOT FOUND STATE
// ============================================

function CanvasAthleteNotFound() {
  return (
    <div className="flex flex-col h-full bg-ink-default">
      <div className="flex-1 flex items-center justify-center">
        <CanvasChamferPanel className="p-12 text-center max-w-md">
          <div className="text-4xl font-mono font-bold text-ink-muted mb-4">?</div>
          <h2 className="text-lg font-semibold text-ink-bright mb-2">Athlete Not Found</h2>
          <p className="text-sm text-ink-secondary mb-6">
            This athlete may have been removed or you don't have access.
          </p>
          <Link to="/app/athletes">
            <CanvasButton variant="primary" size="md">
              Go to Athletes
            </CanvasButton>
          </Link>
        </CanvasChamferPanel>
      </div>
    </div>
  );
}

// ============================================
// LOADING STATE
// ============================================

function CanvasAthleteLoading() {
  return (
    <div className="flex flex-col h-full bg-ink-default">
      <div className="flex-shrink-0 px-6 pt-8 pb-6">
        <div className="h-4 w-32 bg-ink-raised mb-2" />
        <div className="h-12 w-64 bg-ink-raised" />
      </div>
      <div className="flex-1 p-6 space-y-4">
        <div className="h-48 bg-ink-raised" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-64 bg-ink-raised" />
            <div className="h-48 bg-ink-raised" />
          </div>
          <div className="space-y-4">
            <div className="h-48 bg-ink-raised" />
            <div className="h-48 bg-ink-raised" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CANVAS ATHLETE DETAIL PAGE
// ============================================

export function CanvasAthleteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isInitialized, isAuthenticated } = useAuth();
  const { athlete, isLoading, error } = useAthleteDetail(id ?? null);
  const gamificationEnabled = useShowGamification();

  // Show loading while auth is initializing or query is in progress
  if (!isInitialized || !isAuthenticated || isLoading) {
    return <CanvasAthleteLoading />;
  }

  // Error / not found (only after auth is ready and query has completed)
  if (error || !athlete) {
    return <CanvasAthleteNotFound />;
  }

  const fullName = `${athlete.firstName} ${athlete.lastName}`;
  const recentErgTests = athlete.recentErgTests ?? [];
  const last10Tests = recentErgTests.slice(0, 10);
  const attendanceData = athlete.recentAttendance ?? [];
  const attendanceStreak = athlete.attendanceStreak ?? 0;

  return (
    <div className="flex flex-col h-full bg-ink-default">
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="flex-shrink-0 px-4 lg:px-6 pt-6 lg:pt-8 pb-4 lg:pb-6"
      >
        <motion.div variants={fadeUp}>
          {/* Back navigation */}
          <button
            onClick={() => navigate('/app/athletes')}
            className="flex items-center gap-1 text-xs font-mono text-ink-muted uppercase tracking-wider hover:text-ink-bright transition-colors mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Athletes</span>
          </button>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium text-ink-muted uppercase tracking-[0.15em] mb-1">
                Athlete Profile
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-bright tracking-tight leading-none">
                {fullName}
              </h1>
              {athlete.side && (
                <p className="text-sm font-mono text-ink-secondary mt-2">
                  {athlete.side} &middot; {athlete.classYear ?? 'N/A'}
                </p>
              )}
              {/* Pinned Achievement Badges */}
              {gamificationEnabled && (
                <div className="mt-3">
                  <PinnedBadges athleteId={athlete.id} maxDisplay={5} />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ============================================ */}
      {/* CONTENT */}
      {/* ============================================ */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="flex-1 overflow-y-auto px-4 lg:px-6 pb-4 lg:pb-6"
      >
        {/* Profile Hero — wrapped in Canvas container */}
        <motion.div variants={fadeUp} className="mb-4 lg:mb-6">
          <CanvasChamferPanel className="p-4 lg:p-6">
            <ProfileHero athlete={athlete} />
          </CanvasChamferPanel>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Left Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            {/* Erg History */}
            <motion.div variants={fadeUp}>
              <RuledHeader>Erg History</RuledHeader>
              <CanvasChamferPanel className="p-4 lg:p-6 space-y-4">
                <div className="[&_.h-\\[80px\\]]:h-[160px]">
                  <ErgSparkline ergTests={recentErgTests} />
                </div>
                {last10Tests.length > 0 && (
                  <div>
                    <h4 className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-2">
                      Recent Tests
                    </h4>
                    <CanvasErgTestsTable tests={last10Tests} />
                  </div>
                )}
              </CanvasChamferPanel>
            </motion.div>

            {/* Attendance Heatmap */}
            <motion.div variants={fadeUp}>
              <RuledHeader>Attendance</RuledHeader>
              <CanvasChamferPanel className="p-4 lg:p-6">
                <div className="flex flex-wrap items-center gap-3 lg:gap-4 mb-4">
                  <span className="text-xs font-mono text-ink-muted uppercase tracking-wider">
                    Current Streak
                  </span>
                  <span className="text-lg font-mono font-bold text-data-excellent tabular-nums">
                    <ScrambleNumber value={attendanceStreak} />
                  </span>
                  <span className="text-xs font-mono text-ink-muted">days</span>
                </div>
                <AttendanceHeatmap attendanceData={attendanceData} streak={attendanceStreak} />
              </CanvasChamferPanel>
            </motion.div>

            {/* Activity Timeline */}
            <motion.div variants={fadeUp}>
              <RuledHeader>Activity</RuledHeader>
              <CanvasChamferPanel className="p-4 lg:p-6">
                <ActivityTimeline athleteId={athlete.id} />
              </CanvasChamferPanel>
            </motion.div>
          </div>

          {/* Right Column (1/3 width) */}
          <div className="space-y-4 lg:space-y-6">
            {/* Quick Edit */}
            <motion.div variants={fadeUp}>
              <RuledHeader>Quick Edit</RuledHeader>
              <CanvasChamferPanel className="p-4 lg:p-6">
                <AthleteEditForm athlete={athlete} />
              </CanvasChamferPanel>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={fadeUp}>
              <RuledHeader>Quick Actions</RuledHeader>
              <CanvasChamferPanel className="p-4 lg:p-6">
                <QuickActions athleteId={athlete.id} athleteName={fullName} />
              </CanvasChamferPanel>
            </motion.div>

            {/* Achievements */}
            <motion.div variants={fadeUp}>
              <RuledHeader>Achievements</RuledHeader>
              <CanvasChamferPanel className="p-4 lg:p-6">
                <AchievementsSection
                  athleteId={athlete.id}
                  gamificationEnabled={gamificationEnabled}
                />
              </CanvasChamferPanel>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ============================================ */}
      {/* CONSOLE READOUT */}
      {/* ============================================ */}
      <div className="flex-shrink-0 border-t border-white/[0.06] px-4 lg:px-6">
        <CanvasConsoleReadout
          items={[
            { label: 'ERG TESTS', value: recentErgTests.length.toString() },
            { label: 'STREAK', value: `${attendanceStreak}d` },
            { label: 'SIDE', value: athlete.side || '\u2014' },
            { label: 'YEAR', value: athlete.classYear?.toString() || '\u2014' },
          ]}
        />
      </div>
    </div>
  );
}

export default CanvasAthleteDetailPage;
