/**
 * ProfilePage -- top-level orchestrator for the profile feature.
 *
 * Fetches profile and stats data, renders the hero section,
 * tab bar, and active tab content. Tab state is read from
 * URL search params via the route module.
 */
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'motion/react';

import { profileQueryOptions, profileStatsQueryOptions } from '../api';
import { ProfileHero } from './ProfileHero';
import { ProfileTabs } from './ProfileTabs';
import { OverviewTab } from './OverviewTab';
import { TrainingLogTab } from './TrainingLogTab';
import { PRsTab } from './PRsTab';
import { AchievementsTab } from './AchievementsTab';
import { AnalyticsTab } from '@/features/analytics/components/AnalyticsTab';
import { fadeIn } from '@/lib/animations';
import { Route } from '@/routes/_authenticated/profile';
import type { ProfileTab } from '../types';

export function ProfilePage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();

  const { data: profile } = useQuery(profileQueryOptions());
  const { data: stats } = useQuery(profileStatsQueryOptions());

  const handleTabChange = (newTab: string) => {
    void navigate({
      to: '/profile',
      search: { tab: newTab as ProfileTab },
    });
  };

  if (!profile || !stats) return null;

  return (
    <motion.div className="max-w-5xl mx-auto" {...fadeIn}>
      <ProfileHero profile={profile} stats={stats} />
      <ProfileTabs activeTab={tab} onTabChange={handleTabChange} />

      {/* Tab content */}
      <div className="px-4 py-6" role="tabpanel" aria-label={`${tab} tab content`}>
        {tab === 'overview' && <OverviewTab profile={profile} />}
        {tab === 'training-log' && <TrainingLogTab />}
        {tab === 'prs' && <PRsTab />}
        {tab === 'achievements' && <AchievementsTab />}
        {tab === 'analytics' && <AnalyticsTab />}
      </div>
    </motion.div>
  );
}
