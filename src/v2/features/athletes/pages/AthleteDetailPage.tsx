import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAthleteDetail } from '../hooks/useAthleteDetail';
import { useShowGamification } from '../../../hooks/useGamificationPreference';
import { ProfileHero } from '../components/profile/ProfileHero';
import { ErgSparkline } from '../components/profile/ErgSparkline';
import { AttendanceHeatmap } from '../components/profile/AttendanceHeatmap';
import { QuickActions } from '../components/profile/QuickActions';
import { ActivityTimeline } from '../components/profile/ActivityTimeline';
import { AchievementsSection } from '../components/profile/AchievementsSection';
import { TeamTabs } from '../components/profile/TeamTabs';
import { ProfileSkeletonLoader } from '../components/profile/ProfileSkeletonLoader';
import { AthleteEditForm } from '../components/edit/AthleteEditForm';

// ---- Erg Tests Table ----

interface ErgTest {
  id: string;
  testType: string;
  time: string;
  testDate: string;
  distance?: number;
}

function ErgTestsTable({ tests }: { tests: ErgTest[] }) {
  if (tests.length === 0) {
    return <div className="py-4 text-center text-xs text-txt-tertiary">No erg test records</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-bdr-subtle">
            <th className="text-left py-2 px-2 text-[10px] font-medium text-txt-tertiary uppercase tracking-wider">
              Date
            </th>
            <th className="text-left py-2 px-2 text-[10px] font-medium text-txt-tertiary uppercase tracking-wider">
              Type
            </th>
            <th className="text-right py-2 px-2 text-[10px] font-medium text-txt-tertiary uppercase tracking-wider">
              Time
            </th>
            <th className="text-right py-2 px-2 text-[10px] font-medium text-txt-tertiary uppercase tracking-wider">
              Distance
            </th>
          </tr>
        </thead>
        <tbody>
          {tests.map((test) => (
            <tr
              key={test.id}
              className="border-b border-bdr-subtle/50 hover:bg-bg-hover/50 transition-colors"
            >
              <td className="py-2 px-2 text-txt-secondary">
                {new Date(test.testDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </td>
              <td className="py-2 px-2 text-txt-primary font-medium">{test.testType}</td>
              <td
                className="py-2 px-2 text-txt-primary font-mono text-right"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {test.time}
              </td>
              <td
                className="py-2 px-2 text-txt-secondary text-right"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {test.distance ? `${test.distance}m` : '\u2014'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- Not Found ----

function AthleteNotFound() {
  return (
    <div className="p-6">
      <div className="max-w-md mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-bg-hover flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-txt-tertiary">?</span>
        </div>
        <h2 className="text-lg font-semibold text-txt-primary mb-2">Athlete Not Found</h2>
        <p className="text-sm text-txt-secondary mb-6">
          This athlete may have been removed or you don't have access.
        </p>
        <Link
          to="/app/athletes"
          className="inline-flex items-center gap-2 px-4 py-2 bg-interactive-primary text-white text-sm font-medium rounded-lg hover:bg-interactive-primary-hover transition-colors"
        >
          Go to Athletes
        </Link>
      </div>
    </div>
  );
}

// ---- Main Page ----

export function AthleteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { athlete, isLoading, error } = useAthleteDetail(id ?? null);
  const gamificationEnabled = useShowGamification();

  // Multi-team support: default to first team
  // TODO(phase-28-05): When API returns team memberships, populate teams array
  const [activeTeamId, setActiveTeamId] = useState<string>('');
  const teams = athlete?.teamId ? [{ id: athlete.teamId, name: 'Current Team' }] : [];

  // Set active team to first team when loaded
  if (athlete?.teamId && !activeTeamId) {
    setActiveTeamId(athlete.teamId);
  }

  // Loading state
  if (isLoading) {
    return <ProfileSkeletonLoader />;
  }

  // Error / not found
  if (error || !athlete) {
    return <AthleteNotFound />;
  }

  const fullName = `${athlete.firstName} ${athlete.lastName}`;
  const recentErgTests = athlete.recentErgTests ?? [];
  const last10Tests = recentErgTests.slice(0, 10);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        <button
          onClick={() => navigate('/app/athletes')}
          className="flex items-center gap-1 text-txt-secondary hover:text-txt-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Athletes</span>
        </button>
        <ChevronRight className="h-3 w-3 text-txt-tertiary" />
        <span className="text-txt-primary font-medium truncate">{fullName}</span>
      </nav>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Profile Hero */}
          <section className="rounded-xl bg-bg-surface border border-bdr-subtle p-6">
            <ProfileHero athlete={athlete} />
          </section>

          {/* 2. Team Tabs (if multi-team) */}
          {teams.length > 1 && (
            <TeamTabs teams={teams} activeTeamId={activeTeamId} onTeamChange={setActiveTeamId} />
          )}

          {/* 3. Erg History */}
          <section className="rounded-xl bg-bg-surface border border-bdr-subtle p-6 space-y-4">
            <h3 className="text-sm font-semibold text-txt-primary">Erg History</h3>

            {/* Taller sparkline chart */}
            <div className="[&_.h-\\[80px\\]]:h-[160px]">
              <ErgSparkline ergTests={recentErgTests} />
            </div>

            {/* Recent erg tests table */}
            {last10Tests.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-txt-secondary uppercase tracking-wider mb-2">
                  Recent Tests
                </h4>
                <ErgTestsTable tests={last10Tests} />
              </div>
            )}
          </section>

          {/* 4. Attendance Heatmap */}
          <section className="rounded-xl bg-bg-surface border border-bdr-subtle p-6">
            <AttendanceHeatmap
              attendanceData={athlete.recentAttendance ?? []}
              streak={athlete.attendanceStreak ?? 0}
            />
          </section>

          {/* 5. Activity Timeline */}
          <section className="rounded-xl bg-bg-surface border border-bdr-subtle p-6">
            <ActivityTimeline athleteId={athlete.id} />
          </section>
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          {/* 1. Quick Profile Edit */}
          <section className="rounded-xl bg-bg-surface border border-bdr-subtle p-6">
            <AthleteEditForm athlete={athlete} />
          </section>

          {/* 2. Quick Actions */}
          <section className="rounded-xl bg-bg-surface border border-bdr-subtle p-6">
            <QuickActions athleteId={athlete.id} athleteName={fullName} />
          </section>

          {/* 3. Achievements */}
          <section className="rounded-xl bg-bg-surface border border-bdr-subtle p-6">
            <AchievementsSection athleteId={athlete.id} gamificationEnabled={gamificationEnabled} />
          </section>
        </div>
      </div>
    </div>
  );
}

export default AthleteDetailPage;
