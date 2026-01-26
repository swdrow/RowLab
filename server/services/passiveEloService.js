/**
 * Passive ELO Tracking Service
 *
 * Detects lineup changes from practice sessions and updates athlete rankings
 * with reduced weight (0.5x by default).
 */

import prisma from '../db/connection.js';
import { updateRatingsFromSeatRace } from './eloRatingService.js';

// Default weight for passive observations (vs 1.0 for formal seat races)
const DEFAULT_PASSIVE_WEIGHT = 0.5;

// Minimum split difference to record (ignore noise)
const MIN_SPLIT_DIFFERENCE_SECONDS = 0.5;

// ============================================
// SWAP DETECTION
// ============================================

/**
 * Detect potential swap comparisons from a session's pieces
 * Looks for consecutive pieces where exactly 2 athletes differ between boats
 *
 * @param {string} sessionId - Session ID to analyze
 * @returns {Promise<Array<{pieceId, boat1Athletes, boat2Athletes, swapped: [athlete1, athlete2]}>>}
 */
export async function detectSwapsFromSession(sessionId) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      pieces: {
        orderBy: { sequenceNumber: 'asc' },
        include: {
          lineups: {
            include: {
              assignments: true
            }
          }
        }
      }
    }
  });

  if (!session || session.pieces.length < 2) {
    return [];
  }

  const detectedSwaps = [];

  // Compare consecutive pieces
  for (let i = 1; i < session.pieces.length; i++) {
    const prevPiece = session.pieces[i - 1];
    const currPiece = session.pieces[i];

    // For each boat in current piece, find matching boat in previous
    for (const currLineup of currPiece.lineups) {
      const prevLineup = prevPiece.lineups.find(l => l.boatName === currLineup.boatName);

      if (!prevLineup) continue;

      const prevAthletes = new Set(prevLineup.assignments.map(a => a.athleteId));
      const currAthletes = new Set(currLineup.assignments.map(a => a.athleteId));

      // Find swapped athletes
      const leftBoat = [...prevAthletes].filter(id => !currAthletes.has(id));
      const joinedBoat = [...currAthletes].filter(id => !prevAthletes.has(id));

      // Only record clean 1:1 swaps
      if (leftBoat.length === 1 && joinedBoat.length === 1) {
        detectedSwaps.push({
          pieceId: currPiece.id,
          prevPieceId: prevPiece.id,
          boatName: currLineup.boatName,
          swappedOut: leftBoat[0],
          swappedIn: joinedBoat[0],
          prevAthletes: [...prevAthletes],
          currAthletes: [...currAthletes]
        });
      }
    }
  }

  return detectedSwaps;
}

/**
 * Find swapped athletes between two lineups
 * Returns the two athletes that differ (one from each lineup)
 */
export function findSwappedAthletes(lineup1Athletes, lineup2Athletes) {
  const ids1 = new Set(lineup1Athletes);
  const ids2 = new Set(lineup2Athletes);

  const uniqueTo1 = lineup1Athletes.filter(id => !ids2.has(id));
  const uniqueTo2 = lineup2Athletes.filter(id => !ids1.has(id));

  if (uniqueTo1.length === 1 && uniqueTo2.length === 1) {
    return [uniqueTo1[0], uniqueTo2[0]];
  }

  return [];
}

// ============================================
// OBSERVATION RECORDING
// ============================================

/**
 * Record a passive observation from split differences
 * Used when coach manually notes split difference between boats
 *
 * @param {Object} observation
 * @param {string} observation.teamId
 * @param {string[]} observation.boat1Athletes - Athletes in faster boat
 * @param {string[]} observation.boat2Athletes - Athletes in slower boat
 * @param {number} observation.splitDifferenceSeconds - Time difference (positive = boat1 faster)
 * @param {string} [observation.sessionId] - Optional session link
 * @param {string} [observation.pieceId] - Optional piece link
 * @param {number} [observation.weight=0.5] - Weight factor
 * @param {string} [observation.source='manual'] - Source of observation
 * @returns {Promise<PassiveObservation>}
 */
export async function recordPassiveObservation(observation) {
  const {
    teamId,
    boat1Athletes,
    boat2Athletes,
    splitDifferenceSeconds,
    sessionId = null,
    pieceId = null,
    weight = DEFAULT_PASSIVE_WEIGHT,
    source = 'manual'
  } = observation;

  // Ignore tiny differences (noise)
  if (Math.abs(splitDifferenceSeconds) < MIN_SPLIT_DIFFERENCE_SECONDS) {
    return null;
  }

  // Find swapped athletes
  const swapped = findSwappedAthletes(boat1Athletes, boat2Athletes);

  if (swapped.length !== 2) {
    throw new Error('Cannot determine swapped athletes - lineups must differ by exactly 1 athlete');
  }

  const [swappedAthlete1Id, swappedAthlete2Id] = swapped;

  const passiveObservation = await prisma.passiveObservation.create({
    data: {
      teamId,
      sessionId,
      pieceId,
      boat1Athletes,
      boat2Athletes,
      swappedAthlete1Id,
      swappedAthlete2Id,
      splitDifferenceSeconds,
      weight,
      source,
      appliedToRatings: false
    }
  });

  return passiveObservation;
}

/**
 * Record a simple split observation (simplified input)
 * Coach just provides "1V doing 1:50, 2V doing 1:52" = 2 second difference
 *
 * @param {Object} input
 * @param {string} input.teamId
 * @param {string} input.boat1Name - e.g., "1V"
 * @param {string} input.boat2Name - e.g., "2V"
 * @param {string[]} input.boat1Athletes
 * @param {string[]} input.boat2Athletes
 * @param {number} input.boat1SplitSeconds - Split time for boat 1
 * @param {number} input.boat2SplitSeconds - Split time for boat 2
 * @param {string} [input.sessionId]
 */
export async function recordSplitObservation(input) {
  const {
    teamId,
    boat1Athletes,
    boat2Athletes,
    boat1SplitSeconds,
    boat2SplitSeconds,
    sessionId
  } = input;

  const splitDifferenceSeconds = boat2SplitSeconds - boat1SplitSeconds; // Positive = boat1 faster

  return recordPassiveObservation({
    teamId,
    boat1Athletes,
    boat2Athletes,
    splitDifferenceSeconds,
    sessionId,
    weight: DEFAULT_PASSIVE_WEIGHT,
    source: 'split_observation'
  });
}

// ============================================
// ELO UPDATES
// ============================================

/**
 * Apply pending passive observations to ELO ratings
 * Runs as background process after observations are recorded
 *
 * @param {string} teamId
 * @param {Object} options
 * @param {number} [options.limit=100] - Max observations to process
 * @param {boolean} [options.dryRun=false] - If true, calculate but don't persist
 * @returns {Promise<{processed: number, skipped: number, updates: Array}>}
 */
export async function applyPendingObservations(teamId, options = {}) {
  const { limit = 100, dryRun = false } = options;

  const pending = await prisma.passiveObservation.findMany({
    where: {
      teamId,
      appliedToRatings: false
    },
    orderBy: { createdAt: 'asc' },
    take: limit
  });

  const results = {
    processed: 0,
    skipped: 0,
    updates: []
  };

  for (const obs of pending) {
    try {
      // Determine winner based on split difference
      // Positive splitDifference means boat1 was faster
      // The athlete unique to faster boat "wins"
      const winner = obs.splitDifferenceSeconds > 0
        ? obs.swappedAthlete1Id
        : obs.swappedAthlete2Id;

      const loser = winner === obs.swappedAthlete1Id
        ? obs.swappedAthlete2Id
        : obs.swappedAthlete1Id;

      const margin = Math.abs(obs.splitDifferenceSeconds);

      if (!dryRun) {
        // Update ELO with reduced K-factor (via weight parameter)
        await updateRatingsFromSeatRace(
          teamId,
          winner,
          loser,
          margin,
          { weight: obs.weight }
        );

        // Mark observation as applied
        await prisma.passiveObservation.update({
          where: { id: obs.id },
          data: {
            appliedToRatings: true,
            appliedAt: new Date()
          }
        });
      }

      results.updates.push({
        observationId: obs.id,
        winner,
        loser,
        margin,
        weight: obs.weight
      });
      results.processed++;

    } catch (error) {
      console.error(`Failed to apply passive observation ${obs.id}:`, error);
      results.skipped++;
    }
  }

  return results;
}

/**
 * Auto-detect and record observations from a completed session
 * Called after a practice session is finished
 *
 * @param {string} sessionId
 * @param {Object} options
 * @param {boolean} [options.autoApply=false] - Apply to ELO immediately
 */
export async function processSessionForPassiveTracking(sessionId, options = {}) {
  const { autoApply = false } = options;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { teamId: true }
  });

  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  // Detect swaps
  const swaps = await detectSwapsFromSession(sessionId);

  const observations = [];

  for (const swap of swaps) {
    // Get piece times if available
    const piece = await prisma.piece.findUnique({
      where: { id: swap.pieceId },
      select: {
        lineups: {
          select: {
            boatName: true,
            splitSeconds: true,
            assignments: {
              select: { athleteId: true }
            }
          }
        }
      }
    });

    if (!piece) continue;

    // Find the lineups for the boats involved in the swap
    const currBoatLineup = piece.lineups.find(l => l.boatName === swap.boatName);

    // Find the other boat (the one the swapped-out athlete went to)
    const otherLineups = piece.lineups.filter(l => {
      const athleteIds = l.assignments.map(a => a.athleteId);
      return athleteIds.includes(swap.swappedOut);
    });

    if (!currBoatLineup || otherLineups.length === 0) continue;

    const otherBoatLineup = otherLineups[0];

    // If both boats have split times, record observation
    if (currBoatLineup.splitSeconds && otherBoatLineup.splitSeconds) {
      const splitDifference = otherBoatLineup.splitSeconds - currBoatLineup.splitSeconds;

      const obs = await recordPassiveObservation({
        teamId: session.teamId,
        boat1Athletes: currBoatLineup.assignments.map(a => a.athleteId),
        boat2Athletes: otherBoatLineup.assignments.map(a => a.athleteId),
        splitDifferenceSeconds: splitDifference,
        sessionId,
        pieceId: swap.pieceId,
        source: 'auto_detect'
      });

      if (obs) {
        observations.push(obs);
      }
    }
  }

  // Optionally apply to ELO immediately
  if (autoApply && observations.length > 0) {
    await applyPendingObservations(session.teamId);
  }

  return {
    sessionId,
    swapsDetected: swaps.length,
    observationsRecorded: observations.length,
    observations
  };
}

// ============================================
// QUERIES
// ============================================

/**
 * Get passive observation history for an athlete
 */
export async function getAthletePassiveHistory(athleteId, options = {}) {
  const { limit = 50 } = options;

  return prisma.passiveObservation.findMany({
    where: {
      OR: [
        { swappedAthlete1Id: athleteId },
        { swappedAthlete2Id: athleteId }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      swappedAthlete1: { select: { id: true, firstName: true, lastName: true } },
      swappedAthlete2: { select: { id: true, firstName: true, lastName: true } }
    }
  });
}

/**
 * Get team observation statistics
 */
export async function getTeamPassiveStats(teamId) {
  const [total, applied, pending] = await Promise.all([
    prisma.passiveObservation.count({ where: { teamId } }),
    prisma.passiveObservation.count({ where: { teamId, appliedToRatings: true } }),
    prisma.passiveObservation.count({ where: { teamId, appliedToRatings: false } })
  ]);

  return { total, applied, pending };
}

export default {
  detectSwapsFromSession,
  findSwappedAthletes,
  recordPassiveObservation,
  recordSplitObservation,
  applyPendingObservations,
  processSessionForPassiveTracking,
  getAthletePassiveHistory,
  getTeamPassiveStats,
  DEFAULT_PASSIVE_WEIGHT,
  MIN_SPLIT_DIFFERENCE_SECONDS
};
