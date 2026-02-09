/**
 * CanvasChallengesPage - Challenge list/detail with Canvas design language
 *
 * Canvas redesign of ChallengesPage.tsx with:
 * - Canvas header "Gamification / Challenges"
 * - List view reuses ChallengeList component
 * - Detail view with CanvasChamferPanel for challenge info
 * - Reuses LeaderboardLive for challenge standings
 * - CanvasConsoleReadout at bottom
 * - NO rounded corners, NO card wrappers
 */

import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Users, Calendar, Flag } from 'lucide-react';
import { ChallengeList, LeaderboardLive } from '../../features/gamification';
import { useChallenge } from '../../hooks/useChallenges';
import { useGamificationEnabled } from '../../hooks/useGamificationPreference';
import {
  CanvasButton,
  CanvasChamferPanel,
  CanvasConsoleReadout,
  RuledHeader,
} from '@v2/components/canvas';

// ============================================
// STAGGER ANIMATION HELPERS
// ============================================

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

/**
 * Canvas-styled challenge detail view
 */
function CanvasChallengeDetail({ challengeId }: { challengeId: string }) {
  const { data: challenge, isLoading } = useChallenge(challengeId);

  if (isLoading) {
    return (
      <div className="p-6">
        <CanvasConsoleReadout items={[{ label: 'STATUS', value: 'LOADING CHALLENGE' }]} />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="space-y-4">
        <CanvasConsoleReadout items={[{ label: 'ERROR', value: 'CHALLENGE NOT FOUND' }]} />
        <Link to="/app/challenges">
          <CanvasButton variant="ghost">
            <ArrowLeft size={16} />
            Back to challenges
          </CanvasButton>
        </Link>
      </div>
    );
  }

  const isActive = challenge.status === 'active';

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8">
      {/* Back link */}
      <motion.div variants={fadeUp}>
        <Link to="/app/challenges">
          <CanvasButton variant="ghost">
            <ArrowLeft size={16} />
            Back to challenges
          </CanvasButton>
        </Link>
      </motion.div>

      {/* Challenge header */}
      <motion.div variants={fadeUp} className="pt-2 pb-6">
        <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-[0.2em] mb-1">
          Challenge Detail
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-ink-bright tracking-tight leading-none">
          {challenge.name}
        </h1>
        {challenge.description && (
          <p className="text-sm text-ink-secondary mt-3">{challenge.description}</p>
        )}
      </motion.div>

      {/* Challenge info panel */}
      <motion.div variants={fadeUp}>
        <CanvasChamferPanel>
          <div className="flex flex-wrap gap-6 text-sm text-ink-secondary">
            <span className="flex items-center gap-1.5 font-mono">
              <Trophy size={16} className="text-ink-muted" />
              {challenge.type === 'individual' ? 'INDIVIDUAL' : 'TEAM GOAL'}
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <Flag size={16} className="text-ink-muted" />
              {challenge.metric?.toUpperCase()}
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <Users size={16} className="text-ink-muted" />
              {challenge.participantCount || 0} PARTICIPANTS
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <Calendar size={16} className="text-ink-muted" />
              {new Date(challenge.endDate).toLocaleDateString().toUpperCase()}
            </span>
            <span className="font-mono text-ink-bright">
              STATUS: {challenge.status?.toUpperCase()}
            </span>
          </div>
        </CanvasChamferPanel>
      </motion.div>

      {/* Leaderboard */}
      <motion.div variants={fadeUp}>
        <RuledHeader>{isActive ? 'Live Leaderboard' : 'Final Standings'}</RuledHeader>
        <div className="mt-4">
          <LeaderboardLive challengeId={challengeId} isActive={isActive} />
        </div>
      </motion.div>

      {/* Console readout */}
      <motion.div variants={fadeUp}>
        <CanvasConsoleReadout
          items={[
            { label: 'CHALLENGE', value: challenge.name?.toUpperCase() || 'UNKNOWN' },
            { label: 'STATUS', value: challenge.status?.toUpperCase() || 'UNKNOWN' },
            { label: 'METRIC', value: challenge.metric?.toUpperCase() || 'N/A' },
          ]}
        />
      </motion.div>
    </motion.div>
  );
}

/**
 * Main challenges page (list or detail based on route param)
 */
export function CanvasChallengesPage() {
  const { id } = useParams<{ id?: string }>();
  const { enabled } = useGamificationEnabled();

  if (!enabled) {
    return (
      <div className="p-6">
        <CanvasConsoleReadout
          items={[
            { label: 'MODULE', value: 'CHALLENGES' },
            { label: 'STATUS', value: 'GAMIFICATION DISABLED — ENABLE IN SETTINGS' },
          ]}
        />
      </div>
    );
  }

  // Detail view
  if (id) {
    return (
      <div className="max-w-4xl">
        <CanvasChallengeDetail challengeId={id} />
      </div>
    );
  }

  // List view
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8">
      {/* ============================================ */}
      {/* HEADER — text against void */}
      {/* ============================================ */}
      <motion.div variants={fadeUp} className="flex items-end justify-between pt-2 pb-6">
        <div>
          <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-[0.2em] mb-1">
            Gamification
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-ink-bright tracking-tight leading-none">
            Challenges
          </h1>
        </div>
      </motion.div>

      {/* ============================================ */}
      {/* CHALLENGE LIST — reuse existing component */}
      {/* ============================================ */}
      <motion.div variants={fadeUp}>
        <ChallengeList showCreateButton />
      </motion.div>

      {/* ============================================ */}
      {/* CONSOLE READOUT — summary */}
      {/* ============================================ */}
      <motion.div variants={fadeUp}>
        <CanvasConsoleReadout
          items={[
            { label: 'MODULE', value: 'CHALLENGES' },
            { label: 'GAMIFICATION', value: 'ENABLED' },
            { label: 'STATUS', value: 'ACTIVE' },
          ]}
        />
      </motion.div>
    </motion.div>
  );
}

export default CanvasChallengesPage;
