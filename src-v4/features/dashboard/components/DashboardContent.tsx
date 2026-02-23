/**
 * Dashboard layout — Compact Hero + Social Feed + Sidebar.
 *
 * Layout:
 *   Desktop: CompactHero (full) → [SocialFeed (65%) | Sidebar (35%)]
 *   Mobile:  CompactHero → SocialFeed → Sidebar sections
 */
import { motion } from 'motion/react';
import {
  dramaticContainerVariants,
  dramaticItemVariants,
  listContainerVariants,
  listItemVariants,
  SPRING_SMOOTH,
} from '@/lib/animations';
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
    <div className="mx-auto max-w-[1100px] px-4 sm:px-8 pb-20 md:pb-6 pt-6">
      <motion.div variants={dramaticContainerVariants} initial="hidden" animate="visible">
        {/* Compact Hero — full width */}
        <motion.div variants={dramaticItemVariants}>
          <CompactHero userName={userName} stats={data.stats} />
        </motion.div>

        {/* Two-column layout: Feed + Sidebar */}
        <div className="mt-6 flex flex-col lg:flex-row gap-6">
          {/* Main feed column (~65%) */}
          <motion.div
            className="w-full lg:w-[65%] min-w-0"
            variants={listContainerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={listItemVariants} transition={SPRING_SMOOTH}>
              <SocialFeed />
            </motion.div>
          </motion.div>

          {/* Sidebar column (~35%) */}
          <motion.div
            className="w-full lg:w-[35%] space-y-4 lg:sticky lg:top-[80px] lg:self-start lg:max-h-[calc(100vh-96px)] lg:overflow-y-auto lg:scrollbar-thin"
            variants={listContainerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={listItemVariants} transition={SPRING_SMOOTH}>
              <MiniProfileCard userName={userName} username={username} avatar={avatar} />
            </motion.div>

            <motion.div variants={listItemVariants} transition={SPRING_SMOOTH}>
              <ThisWeekStats stats={data.stats} />
            </motion.div>

            {data.stats.streak.current > 0 && (
              <motion.div variants={listItemVariants} transition={SPRING_SMOOTH}>
                <StreakDisplay streak={data.stats.streak} />
              </motion.div>
            )}

            <SectionDivider spacing="my-1" />

            <motion.div variants={listItemVariants} transition={SPRING_SMOOTH}>
              <PRHighlights records={data.prs.records} />
            </motion.div>

            {teamContext && (
              <>
                <SectionDivider spacing="my-1" />
                <motion.div variants={listItemVariants} transition={SPRING_SMOOTH}>
                  <TeamContext teamContext={teamContext} />
                </motion.div>
              </>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
