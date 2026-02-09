import { useParams } from 'react-router-dom';
import { ChallengeList, LeaderboardLive } from '../features/gamification';
import { useChallenge } from '../hooks/useChallenges';
import { useGamificationEnabled } from '../hooks/useGamificationPreference';
import { ArrowLeft, Trophy, Users, Calendar, Flag, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Challenge detail view
 */
function ChallengeDetail({ challengeId }: { challengeId: string }) {
  const { data: challenge, isLoading } = useChallenge(challengeId);

  if (isLoading) {
    return (
      <div className="animate-pulse h-96 bg-surface-elevated rounded-lg border border-bdr-default" />
    );
  }

  if (!challenge) {
    return (
      <div className="text-center py-12">
        <p className="text-txt-secondary">Challenge not found</p>
        <Link
          to="/app/challenges"
          className="text-accent-primary hover:underline mt-2 inline-block"
        >
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
        className="flex items-center gap-2 text-txt-secondary hover:text-accent-primary transition-colors"
      >
        <ArrowLeft size={18} />
        Back to challenges
      </Link>

      {/* Challenge header */}
      <div className="p-6 bg-surface-elevated rounded-xl border border-bdr-default">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-txt-primary">{challenge.name}</h1>
            {challenge.description && (
              <p className="text-txt-secondary mt-2">{challenge.description}</p>
            )}
          </div>

          <span
            className={`
            px-3 py-1.5 rounded-lg text-sm font-medium border
            ${isActive ? 'bg-accent-copper/10 text-accent-primary border-accent-copper/20' : ''}
            ${challenge.status === 'completed' ? 'bg-surface-hover text-txt-secondary border-bdr-default' : ''}
          `}
          >
            {challenge.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-4 mt-4 text-sm text-txt-secondary">
          <span className="flex items-center gap-1.5">
            <Trophy size={16} className="text-accent-primary" />
            {challenge.type === 'individual' ? 'Individual' : 'Team Goal'}
          </span>
          <span className="flex items-center gap-1.5">
            <Flag size={16} className="text-accent-primary" />
            {challenge.metric}
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={16} className="text-accent-primary" />
            {challenge.participantCount || 0} participants
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={16} className="text-accent-primary" />
            {new Date(challenge.endDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="p-6 bg-surface-elevated rounded-xl border border-bdr-default">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-copper" />
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent-primary">
            {isActive ? 'Live Leaderboard' : 'Final Standings'}
          </h2>
        </div>
        <LeaderboardLive challengeId={challengeId} isActive={isActive} />
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
        <Target className="w-16 h-16 text-accent-primary/30 mx-auto mb-4" />
        <h1 className="text-2xl font-display font-bold text-txt-primary mb-2">Challenges</h1>
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
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative px-6 pt-8 pb-6 mb-2 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-copper/[0.06] via-accent-copper/[0.02] to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-accent-copper/30 to-transparent" />
        <div className="relative flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-primary mb-2">
              TEAM CHALLENGES
            </p>
            <h1 className="text-4xl font-display font-bold text-txt-primary tracking-tight">
              Challenges
            </h1>
            <p className="text-sm text-txt-secondary mt-2">
              Compete with teammates and set team goals
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-8">
        {/* Team Challenges Section (Prominent) */}
        <TeamChallengesSection />

        {/* All Challenges */}
        <div>
          <h2 className="text-lg font-semibold text-txt-primary mb-4">All Challenges</h2>
          <ChallengeList showCreateButton />
        </div>
      </div>
    </div>
  );
}

/**
 * Prominent Team Challenges section
 * Shows active collective challenges with progress and CTA
 */
function TeamChallengesSection() {
  const { data: activeChallenges, isLoading } = useActiveChallenges();

  // Filter for collective (team) challenges
  const teamChallenges = activeChallenges?.filter((c) => c.type === 'collective') || [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-txt-primary">Team Challenges</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-32 bg-surface-elevated rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Quiet empty state - no team challenges available
  if (teamChallenges.length === 0) {
    return (
      <div className="p-6 bg-surface-elevated rounded-xl border border-bdr-default">
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-txt-primary mb-1">No active team challenges</h3>
            <p className="text-sm text-txt-secondary">
              Create a collective challenge to rally your team around shared goals.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-txt-primary">Active Team Challenges</h2>
        <span className="text-sm text-txt-secondary">{teamChallenges.length} active</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {teamChallenges.map((challenge) => (
          <TeamChallengeCard key={challenge.id} challenge={challenge} />
        ))}
      </div>
    </div>
  );
}

/**
 * Team challenge card - focused on progress and joining
 */
function TeamChallengeCard({ challenge }: { challenge: any }) {
  const participantCount = challenge.participantCount || 0;

  // Calculate mock progress (TODO: use real progress from API)
  const mockProgress = Math.min(85, participantCount * 10);

  return (
    <Link
      to={`/app/challenges/${challenge.id}`}
      className="block p-4 bg-surface-elevated rounded-lg border border-bdr-default hover:border-accent-copper/30 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-txt-primary group-hover:text-accent-primary transition-colors line-clamp-2">
          {challenge.name}
        </h3>
        <Trophy className="w-4 h-4 text-accent-primary flex-shrink-0 mt-0.5" />
      </div>

      {challenge.description && (
        <p className="text-sm text-txt-secondary line-clamp-2 mb-3">{challenge.description}</p>
      )}

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-txt-tertiary mb-1">
          <span>Team Progress</span>
          <span className="font-mono">{mockProgress}%</span>
        </div>
        <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-copper to-accent-primary transition-all duration-500"
            style={{ width: `${mockProgress}%` }}
          />
        </div>
      </div>

      {/* Participant count + CTA */}
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-txt-tertiary">
          <Users size={14} />
          {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
        </span>
        <span className="text-accent-primary group-hover:underline">View &rarr;</span>
      </div>
    </Link>
  );
}

export default ChallengesPage;
