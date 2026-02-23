/**
 * Team Roster tab: card grid of team members.
 *
 * Grid: 3 cols on xl, 2 cols on md, 1 col on mobile.
 * Sorted: Admins first, then Coaches, then Athletes (alphabetical within each group).
 * Search/filter input at top to filter by name.
 */
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { IconSearch } from '@/components/icons';
import { listContainerVariants, listItemVariants, SPRING_SMOOTH } from '@/lib/animations';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { MemberCard } from './MemberCard';

const ROLE_ORDER: Record<string, number> = {
  OWNER: 0,
  COACH: 1,
  ATHLETE: 2,
};

interface TeamRosterProps {
  teamId: string;
}

export function TeamRoster({ teamId }: TeamRosterProps) {
  const members = useTeamMembers(teamId);
  const [search, setSearch] = useState('');

  const filteredAndSorted = useMemo(() => {
    const query = search.toLowerCase().trim();
    const filtered = query
      ? members.filter(
          (m) => m.name.toLowerCase().includes(query) || m.email.toLowerCase().includes(query)
        )
      : members;

    return [...filtered].sort((a, b) => {
      const roleA = ROLE_ORDER[a.role] ?? 3;
      const roleB = ROLE_ORDER[b.role] ?? 3;
      if (roleA !== roleB) return roleA - roleB;
      return a.name.localeCompare(b.name);
    });
  }, [members, search]);

  return (
    <div className="mt-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <IconSearch
          width={16}
          height={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faint"
        />
        <input
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl bg-void-deep/50 py-2.5 pl-10 pr-4 text-sm text-text-bright placeholder:text-text-faint outline-none transition-colors focus:ring-1 focus:ring-accent-teal/50"
        />
      </div>

      {/* Member count */}
      <p className="text-xs text-accent-sand">
        {filteredAndSorted.length} member{filteredAndSorted.length !== 1 ? 's' : ''}
        {search && ` matching "${search}"`}
      </p>

      {/* Grid */}
      {filteredAndSorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-void-deep/30 py-12 text-center">
          <IconSearch width={24} height={24} className="text-text-faint" />
          <p className="text-sm text-text-dim">No members found.</p>
        </div>
      ) : (
        <motion.div
          variants={listContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {filteredAndSorted.map((member) => (
            <motion.div key={member.id} variants={listItemVariants} transition={SPRING_SMOOTH}>
              <MemberCard member={member} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
