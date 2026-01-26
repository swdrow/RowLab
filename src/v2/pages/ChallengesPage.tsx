import { useParams } from 'react-router-dom';
import { ChallengeList, LeaderboardLive } from '../features/gamification';
import { useChallenge } from '../hooks/useChallenges';
import { useGamificationEnabled } from '../hooks/useGamificationPreference';
import { ArrowLeft, Trophy, Users, Calendar, Flag } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Challenge detail view
 */
function ChallengeDetail({ challengeId }: { challengeId: string }) {
  const { data: challenge, isLoading } = useChallenge(challengeId);

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-surface-hover rounded-lg" />;
  }

  if (!challenge) {
    return (
      <div className="text-center py-12">
        <p className="text-txt-secondary">Challenge not found</p>
        <Link to="/app/challenges" className="text-primary hover:underline mt-2 inline-block">
          Back to challenges
        </Link>
      </div>
    );
  }

  const isActive = challenge.status === 'active';

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        to="/app/challenges"
        className="flex items-center gap-2 text-txt-secondary hover:text-txt-primary transition-colors"
      >
        <ArrowLeft size={18} />
        Back to challenges
      </Link>

      {/* Challenge header */}
      <div className="p-6 bg-surface-elevated rounded-lg border border-bdr">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-txt-primary">{challenge.name}</h1>
            {challenge.description && (
              <p className="text-txt-secondary mt-2">{challenge.description}</p>
            )}
          </div>

          <span className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${isActive ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : ''}
            ${challenge.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : ''}
          `}>
            {challenge.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-4 mt-4 text-sm text-txt-secondary">
          <span className="flex items-center gap-1">
            <Trophy size={16} />
            {challenge.type === 'individual' ? 'Individual' : 'Team Goal'}
          </span>
          <span className="flex items-center gap-1">
            <Flag size={16} />
            {challenge.metric}
          </span>
          <span className="flex items-center gap-1">
            <Users size={16} />
            {challenge.participantCount || 0} participants
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={16} />
            {new Date(challenge.endDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="p-6 bg-surface-elevated rounded-lg border border-bdr">
        <h2 className="text-lg font-semibold text-txt-primary mb-4">
          {isActive ? 'Live Leaderboard' : 'Final Standings'}
        </h2>
        <LeaderboardLive
          challengeId={challengeId}
          isActive={isActive}
        />
      </div>
    </div>
  );
}

/**
 * Main challenges page
 */
export function ChallengesPage() {
  const { id } = useParams<{ id?: string }>();
  const { enabled } = useGamificationEnabled();

  if (!enabled) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-txt-primary mb-2">Challenges</h1>
        <p className="text-txt-secondary">
          Gamification is disabled. Enable it in settings to participate in challenges.
        </p>
      </div>
    );
  }

  // If we have an ID, show detail view
  if (id) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <ChallengeDetail challengeId={id} />
      </div>
    );
  }

  // Otherwise show list
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-txt-primary">Challenges</h1>
        <p className="text-txt-secondary mt-1">
          Compete with your team in friendly challenges
        </p>
      </div>

      <ChallengeList showCreateButton />
    </div>
  );
}

export default ChallengesPage;
