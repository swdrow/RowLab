/**
 * Lineup Optimization Service
 *
 * Provides algorithmic lineup suggestions based on:
 * - Erg scores (power matching)
 * - Side preferences (port/starboard balance)
 * - Coxswain selection
 * - Seat positioning strategy
 *
 * This is a client-side optimization that doesn't require AI/LLM.
 */

import type { Athlete, BoatConfig, ActiveBoat, Seat, ErgTest } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

export interface OptimizationResult {
  boat: SuggestedBoat;
  score: OptimizationScore;
  reasoning: string[];
}

export interface SuggestedBoat {
  boatConfig: BoatConfig;
  seats: SuggestedSeat[];
  coxswain: Athlete | null;
}

export interface SuggestedSeat {
  seatNumber: number;
  side: 'Port' | 'Starboard';
  athlete: Athlete | null;
  confidence: number; // 0-1 how confident we are in this placement
  alternatives: Athlete[]; // Other athletes that could fit here
}

export interface OptimizationScore {
  overall: number; // 0-100
  powerBalance: number; // How well matched the power is (0-100)
  sideBalance: number; // Port/starboard balance (0-100)
  positionFit: number; // How well athletes fit their positions (0-100)
  teamCompatibility: number; // Based on rowing together before (0-100)
}

export interface OptimizationOptions {
  prioritizePower?: boolean; // Weight erg scores heavily
  prioritizeBalance?: boolean; // Weight side balance heavily
  includeAthletes?: number[]; // Athlete IDs that must be included
  excludeAthletes?: number[]; // Athlete IDs to exclude
  fixedPositions?: Map<number, number>; // seatNumber -> athleteId
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Parse erg time string (mm:ss.t) to seconds
 */
function parseErgTime(timeStr: string): number {
  const match = timeStr.match(/^(\d+):(\d{2})\.(\d)$/);
  if (!match) return Infinity;
  const [, minutes, seconds, tenths] = match;
  return parseInt(minutes) * 60 + parseInt(seconds) + parseInt(tenths) / 10;
}

/**
 * Calculate power score from erg data (lower time = higher power)
 */
function calculatePowerScore(athlete: Athlete, ergData: ErgTest[]): number {
  const tests = ergData.filter((e) => e.athleteId === athlete.id && e.testType === '2k');
  if (tests.length === 0) return 50; // Default middle score

  // Get best 2k time
  const bestTime = Math.min(...tests.map((t) => parseErgTime(t.result)));
  if (bestTime === Infinity) return 50;

  // Normalize: 6:00 = 100, 8:00 = 0
  // Linear scale between these values
  const minTime = 360; // 6:00 in seconds
  const maxTime = 480; // 8:00 in seconds
  const normalized = 100 - ((bestTime - minTime) / (maxTime - minTime)) * 100;
  return Math.max(0, Math.min(100, normalized));
}

/**
 * Check if athlete can row a specific side
 */
function canRowSide(athlete: Athlete, side: 'Port' | 'Starboard'): boolean {
  if (athlete.side === 'B') return true; // Bisweptual
  if (side === 'Port') return athlete.side === 'P' || athlete.port;
  if (side === 'Starboard') return athlete.side === 'S' || athlete.starboard;
  return false;
}

/**
 * Calculate side compatibility score
 */
function sideCompatibility(athlete: Athlete, side: 'Port' | 'Starboard'): number {
  if (athlete.side === 'B') return 80; // Good but not ideal
  if (side === 'Port' && (athlete.side === 'P' || athlete.port)) return 100;
  if (side === 'Starboard' && (athlete.side === 'S' || athlete.starboard)) return 100;
  return 0; // Can't row this side
}

/**
 * Get optimal position for an athlete based on power
 * Engine room (seats 3-6) for most power, stroke for rhythm, bow for balance
 */
function getIdealPosition(powerRank: number, totalRowers: number): number[] {
  if (totalRowers === 8) {
    // 8+: Engine room is 3-6, stroke is 8, bow pair is 1-2
    if (powerRank <= 4) return [6, 5, 4, 3]; // Engine room
    if (powerRank <= 6) return [7, 8]; // Stern pair
    return [2, 1]; // Bow pair
  } else if (totalRowers === 4) {
    // 4+/4-: Engine room is 2-3
    if (powerRank <= 2) return [3, 2]; // Engine room
    return [4, 1]; // Ends
  }
  return Array.from({ length: totalRowers }, (_, i) => totalRowers - i);
}

// =============================================================================
// MAIN OPTIMIZATION FUNCTIONS
// =============================================================================

/**
 * Generate an optimized lineup for a specific boat configuration
 */
export function optimizeLineup(
  boatConfig: BoatConfig,
  availableAthletes: Athlete[],
  ergData: ErgTest[],
  options: OptimizationOptions = {}
): OptimizationResult {
  const reasoning: string[] = [];
  const {
    prioritizePower = true,
    prioritizeBalance = true,
    includeAthletes = [],
    excludeAthletes = [],
    fixedPositions = new Map(),
  } = options;

  // Filter athletes
  const candidates = availableAthletes.filter(
    (a) => !excludeAthletes.includes(a.id) && !a.isCoxswain
  );

  // Separate coxswains
  const coxswains = availableAthletes.filter((a) => a.isCoxswain || a.side === 'Cox');

  // Calculate power scores for all candidates
  const athletesWithScores = candidates.map((athlete) => ({
    athlete,
    powerScore: calculatePowerScore(athlete, ergData),
  }));

  // Sort by power (highest first)
  athletesWithScores.sort((a, b) => b.powerScore - a.powerScore);

  reasoning.push(`Evaluated ${candidates.length} athletes for ${boatConfig.name}`);

  // Initialize seats
  const seats: SuggestedSeat[] = [];
  const usedAthletes = new Set<number>();
  const numSeats = boatConfig.numSeats;

  // First, handle fixed positions
  for (const [seatNum, athleteId] of fixedPositions) {
    const athlete = candidates.find((a) => a.id === athleteId);
    if (athlete) {
      usedAthletes.add(athleteId);
      reasoning.push(`Fixed ${athlete.lastName} to seat ${seatNum}`);
    }
  }

  // Build seats from stern (highest number) to bow
  for (let seatNum = numSeats; seatNum >= 1; seatNum--) {
    const side = seatNum % 2 === 0 ? 'Port' : 'Starboard';

    // Check if this position is fixed
    if (fixedPositions.has(seatNum)) {
      const athleteId = fixedPositions.get(seatNum)!;
      const athlete = candidates.find((a) => a.id === athleteId);
      seats.push({
        seatNumber: seatNum,
        side,
        athlete: athlete || null,
        confidence: 1.0,
        alternatives: [],
      });
      continue;
    }

    // Find best available athlete for this position
    const idealPowerRank = getIdealPosition(seatNum, numSeats);
    let bestMatch: { athlete: Athlete; score: number } | null = null;

    for (const { athlete, powerScore } of athletesWithScores) {
      if (usedAthletes.has(athlete.id)) continue;

      // Skip if athlete can't row this side
      if (!canRowSide(athlete, side)) continue;

      // Calculate position fit score
      let positionScore = 50; // Base score
      const powerRank = athletesWithScores.findIndex((a) => a.athlete.id === athlete.id) + 1;

      if (idealPowerRank.includes(seatNum)) {
        // Bonus for being in the right power range
        const rankDiff = Math.abs(powerRank - idealPowerRank.indexOf(seatNum) - 1);
        positionScore = Math.max(0, 100 - rankDiff * 15);
      }

      // Weight factors
      const sideScore = sideCompatibility(athlete, side);
      const totalScore =
        (prioritizePower ? powerScore * 0.4 : powerScore * 0.2) +
        (prioritizeBalance ? sideScore * 0.4 : sideScore * 0.2) +
        positionScore * 0.3;

      if (!bestMatch || totalScore > bestMatch.score) {
        bestMatch = { athlete, score: totalScore };
      }
    }

    if (bestMatch) {
      usedAthletes.add(bestMatch.athlete.id);
      const confidence = Math.min(1, bestMatch.score / 100);

      // Find alternatives
      const alternatives = athletesWithScores
        .filter(
          ({ athlete }) =>
            !usedAthletes.has(athlete.id) &&
            canRowSide(athlete, side) &&
            athlete.id !== bestMatch?.athlete.id
        )
        .slice(0, 3)
        .map((a) => a.athlete);

      seats.push({
        seatNumber: seatNum,
        side,
        athlete: bestMatch.athlete,
        confidence,
        alternatives,
      });

      if (seatNum === numSeats) {
        reasoning.push(`Selected ${bestMatch.athlete.lastName} as stroke (seat ${seatNum})`);
      } else if (seatNum >= 3 && seatNum <= 6 && numSeats === 8) {
        reasoning.push(`Engine room: ${bestMatch.athlete.lastName} in seat ${seatNum}`);
      }
    } else {
      // No suitable athlete found
      seats.push({
        seatNumber: seatNum,
        side,
        athlete: null,
        confidence: 0,
        alternatives: [],
      });
      reasoning.push(`Could not find suitable athlete for seat ${seatNum} (${side})`);
    }
  }

  // Sort seats by seat number
  seats.sort((a, b) => b.seatNumber - a.seatNumber);

  // Select coxswain if needed
  let selectedCox: Athlete | null = null;
  if (boatConfig.hasCoxswain && coxswains.length > 0) {
    selectedCox = coxswains[0];
    reasoning.push(`Selected ${selectedCox.lastName} as coxswain`);
  }

  // Calculate overall scores
  const assignedSeats = seats.filter((s) => s.athlete);
  const powerScores = assignedSeats.map((s) =>
    calculatePowerScore(s.athlete!, ergData)
  );
  const avgPower = powerScores.reduce((a, b) => a + b, 0) / powerScores.length || 0;

  // Power balance: how consistent are the power scores
  const powerVariance =
    powerScores.length > 1
      ? Math.sqrt(
          powerScores.reduce((sum, p) => sum + Math.pow(p - avgPower, 2), 0) /
            powerScores.length
        )
      : 0;
  const powerBalance = Math.max(0, 100 - powerVariance * 2);

  // Side balance: count port vs starboard
  const portCount = assignedSeats.filter(
    (s) => s.side === 'Port' && canRowSide(s.athlete!, 'Port')
  ).length;
  const starboardCount = assignedSeats.filter(
    (s) => s.side === 'Starboard' && canRowSide(s.athlete!, 'Starboard')
  ).length;
  const sideBalance = 100 - Math.abs(portCount - starboardCount) * 10;

  // Position fit: average confidence
  const positionFit =
    (seats.reduce((sum, s) => sum + s.confidence, 0) / seats.length) * 100;

  // Overall score
  const overall = (powerBalance * 0.3 + sideBalance * 0.3 + positionFit * 0.4);

  return {
    boat: {
      boatConfig,
      seats,
      coxswain: selectedCox,
    },
    score: {
      overall: Math.round(overall),
      powerBalance: Math.round(powerBalance),
      sideBalance: Math.round(sideBalance),
      positionFit: Math.round(positionFit),
      teamCompatibility: 75, // Would need historical data
    },
    reasoning,
  };
}

/**
 * Generate multiple lineup options for comparison
 */
export function generateLineupOptions(
  boatConfig: BoatConfig,
  athletes: Athlete[],
  ergData: ErgTest[],
  numOptions: number = 3
): OptimizationResult[] {
  const results: OptimizationResult[] = [];

  // Option 1: Power-optimized
  results.push(
    optimizeLineup(boatConfig, athletes, ergData, {
      prioritizePower: true,
      prioritizeBalance: false,
    })
  );

  // Option 2: Balance-optimized
  results.push(
    optimizeLineup(boatConfig, athletes, ergData, {
      prioritizePower: false,
      prioritizeBalance: true,
    })
  );

  // Option 3: Balanced approach
  if (numOptions >= 3) {
    results.push(
      optimizeLineup(boatConfig, athletes, ergData, {
        prioritizePower: true,
        prioritizeBalance: true,
      })
    );
  }

  // Sort by overall score
  results.sort((a, b) => b.score.overall - a.score.overall);

  return results.slice(0, numOptions);
}

/**
 * Analyze an existing lineup and provide suggestions
 */
export function analyzeLineup(
  boat: ActiveBoat,
  athletes: Athlete[],
  ergData: ErgTest[]
): {
  issues: string[];
  suggestions: string[];
  score: OptimizationScore;
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  const assignedAthletes = boat.seats
    .filter((s) => s.athlete)
    .map((s) => s.athlete!);

  // Check side compatibility
  for (const seat of boat.seats) {
    if (!seat.athlete) continue;
    const side = seat.side as 'Port' | 'Starboard';
    if (!canRowSide(seat.athlete, side)) {
      issues.push(
        `${seat.athlete.lastName} (seat ${seat.seatNumber}) cannot row ${side}`
      );
    }
  }

  // Check power distribution
  const powerScores = assignedAthletes.map((a) => ({
    athlete: a,
    power: calculatePowerScore(a, ergData),
  }));

  const avgPower = powerScores.reduce((sum, p) => sum + p.power, 0) / powerScores.length || 0;

  // Find weak links
  for (const { athlete, power } of powerScores) {
    if (power < avgPower - 20) {
      suggestions.push(`${athlete.lastName} is underpowered relative to crew average`);
    }
  }

  // Check stroke selection
  const stroke = boat.seats.find((s) => s.seatNumber === boat.seats.length);
  if (stroke?.athlete) {
    const strokePower = calculatePowerScore(stroke.athlete, ergData);
    if (strokePower < 60) {
      suggestions.push(`Consider a higher-powered athlete for stroke position`);
    }
  }

  // Calculate scores
  const powerVariance =
    powerScores.length > 1
      ? Math.sqrt(
          powerScores.reduce((sum, p) => sum + Math.pow(p.power - avgPower, 2), 0) /
            powerScores.length
        )
      : 0;

  return {
    issues,
    suggestions,
    score: {
      overall: Math.round(avgPower),
      powerBalance: Math.round(100 - powerVariance * 2),
      sideBalance: issues.length === 0 ? 100 : 100 - issues.length * 15,
      positionFit: 75, // Would need more analysis
      teamCompatibility: 75,
    },
  };
}

export default {
  optimizeLineup,
  generateLineupOptions,
  analyzeLineup,
};
