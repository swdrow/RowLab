/**
 * Team dashboard tab container.
 *
 * 3 tabs: Overview, Roster, Activity -- state persisted via URL search params.
 * Tab bar is sticky with panel styling and active indicator.
 * Reads team data from parent layout route loader.
 */
import { Suspense } from 'react';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { IconLayout, IconUsers, IconActivity } from '@/components/icons';
import { TabToggle } from '@/components/ui/TabToggle';
import { TeamOverview } from './TeamOverview';
import { TeamRoster } from './TeamRoster';
import { TeamActivityFeed } from './TeamActivityFeed';
import { TeamDashboardSkeleton } from './TeamDashboardSkeleton';
import type { TeamDetail } from '../types';

const parentRoute = getRouteApi('/_authenticated/team/$identifier');
const dashboardRoute = getRouteApi('/_authenticated/team/$identifier/dashboard');

const TABS = [
  { id: 'overview' as const, label: 'Overview', icon: IconLayout },
  { id: 'roster' as const, label: 'Roster', icon: IconUsers },
  { id: 'activity' as const, label: 'Activity', icon: IconActivity },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function TeamDashboardContent() {
  const { team } = parentRoute.useLoaderData() as { team: TeamDetail };
  const { tab } = dashboardRoute.useSearch();
  const navigate = useNavigate();

  const activeTab = (tab || 'overview') as TabId;

  function handleTabChange(newTab: TabId) {
    void navigate({
      to: '/team/$identifier/dashboard',
      params: { identifier: team.slug || team.generatedId },
      search: { tab: newTab },
      replace: true,
    });
  }

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 pb-20 md:pb-6">
      {/* Team header */}
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-text-bright">{team.name}</h1>
        {team.description && <p className="mt-1 text-sm text-text-dim">{team.description}</p>}
      </div>

      {/* Tab bar */}
      <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 pb-4 pt-1 panel">
        <TabToggle
          tabs={TABS.map((t) => ({
            id: t.id,
            label: t.label,
            icon: <t.icon width={16} height={16} />,
          }))}
          activeTab={activeTab}
          onTabChange={(id) => handleTabChange(id as TabId)}
          layoutId="team-tab-indicator"
          fullWidth
        />
      </div>

      {/* Tab content */}
      <div role="tabpanel" aria-label={`${activeTab} tab`}>
        <Suspense fallback={<TeamDashboardSkeleton tabOnly />}>
          {activeTab === 'overview' && <TeamOverview team={team} />}
          {activeTab === 'roster' && <TeamRoster teamId={team.id} />}
          {activeTab === 'activity' && <TeamActivityFeed teamId={team.id} />}
        </Suspense>
      </div>
    </div>
  );
}
