import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useChallenges, useActiveChallenges } from '../../../hooks/useChallenges';
import { ChallengeCard } from './ChallengeCard';
import { CreateChallengeForm } from './CreateChallengeForm';
import type { ChallengeStatus } from '../../../types/gamification';

interface ChallengeListProps {
  showCreateButton?: boolean;
}

export function ChallengeList({ showCreateButton = true }: ChallengeListProps) {
  const [filter, setFilter] = useState<ChallengeStatus | 'all'>('active');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: allChallenges, isLoading } = useChallenges(filter === 'all' ? undefined : filter);
  const { data: activeChallenges } = useActiveChallenges();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 bg-surface-elevated rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const challenges = filter === 'all' ? allChallenges : allChallenges;

  return (
    <div className="space-y-4">
      {/* Header with filter and create button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(['active', 'completed', 'all'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`
                px-3 py-1.5 text-sm rounded-lg transition-colors
                ${
                  filter === status
                    ? 'bg-primary text-white'
                    : 'bg-surface-hover text-txt-secondary hover:text-txt-primary'
                }
              `}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'active' && activeChallenges && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                  {activeChallenges.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {showCreateButton && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus size={18} />
            New Challenge
          </button>
        )}
      </div>

      {/* Create form modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg bg-surface-elevated rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-txt-primary mb-4">Create Challenge</h2>
            <CreateChallengeForm
              onSuccess={() => setShowCreateForm(false)}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}

      {/* Challenge list */}
      <div className="space-y-3">
        {challenges?.map((challenge) => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}

        {(!challenges || challenges.length === 0) && (
          <div className="text-center py-12 text-txt-secondary">
            <p>No {filter !== 'all' ? filter : ''} challenges</p>
            {filter === 'active' && showCreateButton && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-2 text-primary hover:underline"
              >
                Create your first challenge
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChallengeList;
