/**
 * PRs tab content for the profile page.
 * Fetches cross-machine personal records and displays them
 * with a machine toggle (RowErg / SkiErg / BikeErg) and PR table.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';

import { IconTrophy } from '@/components/icons';
import { profilePRsQueryOptions } from '../api';
import { MachineTabs, type MachineType } from './MachineTabs';
import { PRTable } from './PRTable';
import { Card } from '@/components/ui/Card';
import { FancySectionHeader } from '@/components/ui/FancySectionHeader';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { slideUp } from '@/lib/animations';

export function PRsTab() {
  const [activeMachine, setActiveMachine] = useState<MachineType>('rower');
  const { data, isLoading } = useQuery(profilePRsQueryOptions());

  if (isLoading) {
    return <PRsTabSkeleton />;
  }

  const records = data?.byMachine?.[activeMachine] ?? [];

  return (
    <motion.div className="space-y-4" {...slideUp}>
      <div className="flex items-center justify-between">
        <FancySectionHeader label="Personal Records" icon={IconTrophy} accentColor="teal" />
        <MachineTabs activeMachine={activeMachine} onMachineChange={setActiveMachine} />
      </div>

      <Card padding="md">
        <PRTable records={records} machineType={activeMachine} />
      </Card>
    </motion.div>
  );
}

function PRsTabSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton width="160px" height="1.5rem" />
        <div className="flex gap-2">
          <Skeleton width="80px" height="2rem" rounded="lg" />
          <Skeleton width="70px" height="2rem" rounded="lg" />
          <Skeleton width="75px" height="2rem" rounded="lg" />
        </div>
      </div>
      <div className="panel rounded-xl p-5">
        <SkeletonGroup>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} height="2.5rem" className="w-full" />
          ))}
        </SkeletonGroup>
      </div>
    </div>
  );
}
