/**
 * Dashboard layout — Compact Hero + Social Feed + Sidebar.
 *
 * Layout:
 *   Desktop: CompactHero (full) → [SocialFeed (65%) | Sidebar (35%)]
 *   Mobile:  CompactHero → SocialFeed → Sidebar sections
 */
import { motion } from 'motion/react';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { CompactHero } from './CompactHero';
import { MiniProfileCard } from './MiniProfileCard';
import { ThisWeekStats } from './ThisWeekStats';
import { StreakDisplay } from './StreakDisplay';
import { PRHighlights } from './PRHighlights';
import { TeamContext } from './TeamContext';
import { SocialFeed } from '@/features/feed/components/SocialFeed';
import type { DashboardData, TeamContextData } from '../types';

interface DashboardContentProps {
  data: DashboardData;
  userName: string;
  username?: string;
  avatar?: string | null;
  teamContext: TeamContextData | null;
}

export function DashboardContent({
  data,
  userName,
  username,
  avatar,
  teamContext,
}: DashboardContentProps) {
  return (
    <motion.div
      className="mx-auto max-w-[1100px] px-4 sm:px-8 pb-20 md:pb-6 pt-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      {/* Compact Hero — full width */}
      <CompactHero userName={userName} stats={data.stats} />

      {/* Two-column layout: Feed + Sidebar */}
      <div className="mt-6 flex flex-col lg:flex-row gap-6">
        {/* Main feed column (~65%) */}
        <div className="w-full lg:w-[65%] min-w-0">
          <SocialFeed />
        </div>

        {/* Sidebar column (~35%) */}
        <div className="w-full lg:w-[35%] space-y-4 lg:sticky lg:top-[80px] lg:self-start lg:max-h-[calc(100vh-96px)] lg:overflow-y-auto lg:scrollbar-thin">
          <MiniProfileCard userName={userName} username={username} avatar={avatar} />
          <ThisWeekStats stats={data.stats} />

          {data.stats.streak.current > 0 && <StreakDisplay streak={data.stats.streak} />}

          <SectionDivider className="my-1" />

          <PRHighlights records={data.prs.records} />

          {teamContext && (
            <>
              <SectionDivider className="my-1" />
              <TeamContext teamContext={teamContext} />
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
