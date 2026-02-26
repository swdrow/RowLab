/**
 * Athletes roster page. Shows team athletes with search, side filter,
 * and basic info (name, side, weight class, year).
 * Requires active team context (guarded by _team layout).
 */
import { useState, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { RouteErrorFallback } from '@/components/error/RouteErrorFallback';
import { motion } from 'motion/react';
import { IconUsers, IconSearch, IconUser } from '@/components/icons';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';

export const Route = createFileRoute('/_authenticated/_team/athletes')({
  errorComponent: RouteErrorFallback,
  component: AthletesPage,
  staticData: {
    breadcrumb: 'Athletes',
  },
});

interface Athlete {
  id: string;
  name: string;
  side: string | null;
  weightClass: string | null;
  year: string | null;
  status: string | null;
}

function useAthletes() {
  return useQuery<Athlete[]>({
    queryKey: ['athletes', 'list'],
    queryFn: async () => {
      const res = await api.get('/api/v1/athletes');
      return res.data.data.athletes as Athlete[];
    },
    staleTime: 120_000,
  });
}

type SideFilter = 'all' | 'Port' | 'Starboard' | 'Cox';

const SIDE_TABS: { value: SideFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'Port', label: 'Port' },
  { value: 'Starboard', label: 'Starboard' },
  { value: 'Cox', label: 'Cox' },
];

function AthletesPage() {
  const { activeTeamRole: _activeTeamRole } = useAuth();
  const { data: athletes = [], isLoading, error, refetch } = useAthletes();
  const [search, setSearch] = useState('');
  const [sideFilter, setSideFilter] = useState<SideFilter>('all');

  const filtered = useMemo(() => {
    let result = athletes;
    if (sideFilter !== 'all') {
      result = result.filter((a) => a.side === sideFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((a) => a.name.toLowerCase().includes(q));
    }
    return result;
  }, [athletes, sideFilter, search]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton height="2rem" width="12rem" rounded="lg" />
        <SkeletonGroup className="gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} height="3.5rem" rounded="lg" />
          ))}
        </SkeletonGroup>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center py-12">
        <ErrorState
          title="Failed to load athletes"
          message="Could not fetch the team roster. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6 pb-20 md:pb-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <IconUsers className="h-5 w-5 text-text-faint" />
            <p className="text-xs font-medium uppercase tracking-wider text-text-faint">Team</p>
          </div>
          <h1 className="text-2xl font-display font-bold text-heading-gradient tracking-tight">
            Athletes
            {athletes.length > 0 && (
              <span className="ml-2 text-base font-normal text-text-faint">
                ({athletes.length})
              </span>
            )}
          </h1>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-faint" />
            <input
              type="text"
              placeholder="Search athletes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg bg-void-deep border border-edge-default pl-9 pr-3 py-2 text-sm text-text-bright placeholder:text-text-faint focus:outline-none focus:ring-1 focus:ring-accent-teal/50"
            />
          </div>
          <div className="flex gap-1 p-1 bg-void-deep/40 rounded-xl w-fit">
            {SIDE_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSideFilter(tab.value)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
                  ${
                    sideFilter === tab.value
                      ? 'bg-void-raised text-text-bright shadow-sm'
                      : 'text-text-faint hover:text-text-dim'
                  }
                `.trim()}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div>
            <EmptyState
              icon={IconUsers}
              title={search || sideFilter !== 'all' ? 'No matching athletes' : 'No athletes yet'}
              description={
                search || sideFilter !== 'all'
                  ? 'Try adjusting your search or filter.'
                  : 'Athletes will appear here once they join the team.'
              }
            />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="space-y-1"
          >
            {filtered.map((athlete) => (
              <div
                key={athlete.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-void-overlay transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-void-raised shrink-0">
                  <IconUser className="h-4 w-4 text-text-faint" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-bright truncate">{athlete.name}</p>
                  <div className="flex items-center gap-2 text-xs text-text-faint">
                    {athlete.side && <span>{athlete.side}</span>}
                    {athlete.weightClass && (
                      <>
                        {athlete.side && <span className="text-edge-default">|</span>}
                        <span>{athlete.weightClass}</span>
                      </>
                    )}
                    {athlete.year && (
                      <>
                        <span className="text-edge-default">|</span>
                        <span>{athlete.year}</span>
                      </>
                    )}
                  </div>
                </div>
                {athlete.status && (
                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
                      athlete.status === 'active'
                        ? 'bg-data-good/10 text-data-good'
                        : 'bg-void-deep text-text-faint'
                    }`}
                  >
                    {athlete.status}
                  </span>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
