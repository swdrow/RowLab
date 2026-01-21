import prisma from '../db/connection.js';

/**
 * AI Lineup Optimizer Service
 * Uses genetic algorithm to generate optimal rowing lineups
 */

/**
 * Get boat configuration for a given boat class
 * @param {string} boatClass - Boat class ('8+', '4+', '4-', '2-', '1x')
 * @returns {{ seats: number, hasCox: boolean, sides: string[] }}
 */
export function getBoatConfig(boatClass) {
  const configs = {
    '8+': { seats: 8, hasCox: true, sides: ['port', 'starboard'] },
    '4+': { seats: 4, hasCox: true, sides: ['port', 'starboard'] },
    '4-': { seats: 4, hasCox: false, sides: ['port', 'starboard'] },
    '2-': { seats: 2, hasCox: false, sides: ['port', 'starboard'] },
    '1x': { seats: 1, hasCox: false, sides: ['both'] }
  };

  return configs[boatClass] || configs['8+'];
}

/**
 * Get side for a given seat number (standard rigging)
 * @param {number} seatNumber - Seat number (1-8, where 1 is bow)
 * @param {string} boatClass - Boat class
 * @returns {string} - 'port' or 'starboard'
 */
function getSideForSeat(seatNumber, boatClass) {
  if (boatClass === '1x') return 'both';
  // Standard rigging: odd seats = starboard, even seats = port
  return seatNumber % 2 === 1 ? 'starboard' : 'port';
}

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled array copy
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate initial population of random lineups
 * @param {Array} athletes - Available athletes with their scores
 * @param {string} boatClass - Boat class
 * @param {Object} constraints - Lineup constraints
 * @param {number} size - Population size
 * @returns {Array} - Array of chromosomes
 */
export function generateInitialPopulation(athletes, boatClass, constraints, size) {
  const population = [];
  const config = getBoatConfig(boatClass);

  // Filter out excluded athletes
  const availableAthletes = athletes.filter(
    a => !constraints.excluded?.includes(a.id)
  );

  // Separate coxswain candidates if needed
  const coxCandidates = availableAthletes.filter(a => a.isCoxswain);
  const rowerCandidates = availableAthletes.filter(a => !a.isCoxswain);

  for (let i = 0; i < size; i++) {
    const lineup = [];
    let usedAthleteIds = new Set();

    // Handle coxswain if boat has one
    if (config.hasCox) {
      let coxswain = null;
      if (constraints.coxswain) {
        coxswain = availableAthletes.find(a => a.id === constraints.coxswain);
      } else if (coxCandidates.length > 0) {
        const randomIndex = Math.floor(Math.random() * coxCandidates.length);
        coxswain = coxCandidates[randomIndex];
      }

      if (coxswain) {
        lineup.push({
          athleteId: coxswain.id,
          seatNumber: 0, // 0 = coxswain seat
          side: 'cox'
        });
        usedAthleteIds.add(coxswain.id);
      }
    }

    // Get required athletes first
    const requiredAthletes = constraints.required
      ? rowerCandidates.filter(a => constraints.required.includes(a.id))
      : [];

    // Get remaining available rowers
    const remainingRowers = rowerCandidates.filter(
      a => !constraints.required?.includes(a.id) && !usedAthleteIds.has(a.id)
    );

    // Shuffle remaining rowers for randomness
    const shuffledRemaining = shuffleArray(remainingRowers);

    // Combine required first, then remaining
    const allRowers = [...requiredAthletes, ...shuffledRemaining];

    // Assign to seats
    for (let seat = 1; seat <= config.seats && allRowers.length > 0; seat++) {
      const side = getSideForSeat(seat, boatClass);

      // Find best available rower for this seat
      let rowerIndex = -1;

      // First, try to find someone who prefers this side
      for (let j = 0; j < allRowers.length; j++) {
        if (usedAthleteIds.has(allRowers[j].id)) continue;

        const pref = constraints.sidePreferences?.[allRowers[j].id];
        if (pref === side || pref === 'both' || !pref) {
          rowerIndex = j;
          break;
        }
      }

      // If no preference match, take anyone available
      if (rowerIndex === -1) {
        for (let j = 0; j < allRowers.length; j++) {
          if (!usedAthleteIds.has(allRowers[j].id)) {
            rowerIndex = j;
            break;
          }
        }
      }

      if (rowerIndex !== -1) {
        lineup.push({
          athleteId: allRowers[rowerIndex].id,
          seatNumber: seat,
          side: side
        });
        usedAthleteIds.add(allRowers[rowerIndex].id);
      }
    }

    // Only add if lineup is complete
    if (lineup.filter(l => l.seatNumber > 0).length === config.seats) {
      population.push(lineup);
    } else if (i < size - 1) {
      // Try again if lineup incomplete, but cap retries to prevent infinite loop
      const MAX_RETRIES = 50;
      if (i < MAX_RETRIES) {
        i--;
      }
    }
  }

  return population;
}

/**
 * Evaluate fitness of a lineup
 * @param {Array} lineup - Chromosome (seat assignments)
 * @param {Array} athleteScores - Athletes with their scores
 * @param {Object} constraints - Lineup constraints
 * @returns {number} - Fitness score (higher = better)
 */
export function evaluateFitness(lineup, athleteScores, constraints = {}) {
  let fitness = 0;
  const scoreMap = new Map(athleteScores.map(a => [a.id, a]));

  // Sum individual athlete scores
  for (const assignment of lineup) {
    const athlete = scoreMap.get(assignment.athleteId);
    if (!athlete) continue;

    // Skip coxswain for speed calculations
    if (assignment.seatNumber === 0) {
      // Coxswain contributes less to speed but still matters
      fitness += (athlete.combinedScore || 50) * 0.1;
      continue;
    }

    // Base score from athlete's combined score
    const baseScore = athlete.combinedScore || 50;
    fitness += baseScore;

    // Side preference bonus/penalty
    const pref = constraints.sidePreferences?.[assignment.athleteId];
    if (pref) {
      if (pref === assignment.side || pref === 'both') {
        // Bonus for matching preference
        fitness += 5;
      } else {
        // Penalty for wrong side
        fitness -= 10;
      }
    }
  }

  // Bonus for balance (similar scores on port and starboard)
  const portScores = lineup
    .filter(a => a.side === 'port')
    .map(a => scoreMap.get(a.athleteId)?.combinedScore || 50);
  const starboardScores = lineup
    .filter(a => a.side === 'starboard')
    .map(a => scoreMap.get(a.athleteId)?.combinedScore || 50);

  if (portScores.length > 0 && starboardScores.length > 0) {
    const portAvg = portScores.reduce((a, b) => a + b, 0) / portScores.length;
    const starboardAvg = starboardScores.reduce((a, b) => a + b, 0) / starboardScores.length;
    const imbalance = Math.abs(portAvg - starboardAvg);

    // Small penalty for imbalance
    fitness -= imbalance * 0.5;
  }

  return fitness;
}

/**
 * Tournament selection for parent selection
 * @param {Array} population - Array of chromosomes
 * @param {Array} fitnesses - Fitness scores for each chromosome
 * @returns {Array} - Two selected parent chromosomes
 */
export function selectParents(population, fitnesses) {
  const tournamentSize = 3;
  const parents = [];

  for (let p = 0; p < 2; p++) {
    // Select random candidates for tournament
    const candidates = [];
    for (let i = 0; i < tournamentSize; i++) {
      const idx = Math.floor(Math.random() * population.length);
      candidates.push({ index: idx, fitness: fitnesses[idx] });
    }

    // Select best from tournament
    candidates.sort((a, b) => b.fitness - a.fitness);
    parents.push(population[candidates[0].index]);
  }

  return parents;
}

/**
 * Crossover two parent lineups to create child
 * @param {Array} parent1 - First parent chromosome
 * @param {Array} parent2 - Second parent chromosome
 * @returns {Array} - Child chromosome
 */
export function crossover(parent1, parent2) {
  // Get only rower seats (exclude coxswain at seat 0)
  const rowers1 = parent1.filter(a => a.seatNumber > 0).sort((a, b) => a.seatNumber - b.seatNumber);
  const rowers2 = parent2.filter(a => a.seatNumber > 0).sort((a, b) => a.seatNumber - b.seatNumber);
  const cox1 = parent1.find(a => a.seatNumber === 0);

  if (rowers1.length === 0) return [...parent1];

  // Single-point crossover
  const crossoverPoint = Math.floor(Math.random() * (rowers1.length - 1)) + 1;

  // Take seats 1 to crossoverPoint from parent1
  const child = [];
  const usedAthletes = new Set();

  // Add coxswain if exists
  if (cox1) {
    child.push({ ...cox1 });
    usedAthletes.add(cox1.athleteId);
  }

  // First part from parent1
  for (let i = 0; i < crossoverPoint; i++) {
    child.push({ ...rowers1[i] });
    usedAthletes.add(rowers1[i].athleteId);
  }

  // Remaining from parent2, avoiding duplicates
  for (let i = crossoverPoint; i < rowers1.length; i++) {
    const seat = rowers1[i].seatNumber;
    const side = rowers1[i].side;

    // Try to find unused athlete from parent2 at this position
    let assigned = false;
    for (const assignment of rowers2) {
      if (!usedAthletes.has(assignment.athleteId)) {
        child.push({
          athleteId: assignment.athleteId,
          seatNumber: seat,
          side: side
        });
        usedAthletes.add(assignment.athleteId);
        assigned = true;
        break;
      }
    }

    // If no unused athlete found, this is an error state
    if (!assigned) {
      // Fallback: use parent1's athlete if somehow still available
      if (!usedAthletes.has(rowers1[i].athleteId)) {
        child.push({ ...rowers1[i] });
        usedAthletes.add(rowers1[i].athleteId);
      }
    }
  }

  return child;
}

/**
 * Mutate a lineup with given probability
 * @param {Array} lineup - Chromosome to mutate
 * @param {number} rate - Mutation probability (0-1)
 * @returns {Array} - Mutated chromosome
 */
export function mutate(lineup, rate) {
  if (Math.random() > rate) {
    return lineup;
  }

  const mutated = lineup.map(a => ({ ...a }));
  const rowerIndices = mutated
    .map((a, i) => a.seatNumber > 0 ? i : -1)
    .filter(i => i !== -1);

  if (rowerIndices.length < 2) return mutated;

  // Swap two random rower positions
  const idx1 = rowerIndices[Math.floor(Math.random() * rowerIndices.length)];
  let idx2 = idx1;
  while (idx2 === idx1) {
    idx2 = rowerIndices[Math.floor(Math.random() * rowerIndices.length)];
  }

  // Swap athlete IDs but keep seat assignments
  const tempAthleteId = mutated[idx1].athleteId;
  mutated[idx1].athleteId = mutated[idx2].athleteId;
  mutated[idx2].athleteId = tempAthleteId;

  return mutated;
}

/**
 * Enforce constraints on a lineup
 * @param {Array} lineup - Chromosome to fix
 * @param {Object} constraints - Lineup constraints
 * @param {Array} athletes - Available athletes
 * @returns {Array|null} - Valid lineup or null if impossible
 */
export function enforceConstraints(lineup, constraints, athletes) {
  const fixed = lineup.map(a => ({ ...a }));
  const config = getBoatConfig(constraints.boatClass || '8+');

  // Check excluded athletes
  for (const assignment of fixed) {
    if (constraints.excluded?.includes(assignment.athleteId)) {
      // Find replacement
      const usedIds = new Set(fixed.map(a => a.athleteId));
      const availableRowers = athletes.filter(
        a => !usedIds.has(a.id) &&
             !constraints.excluded?.includes(a.id) &&
             (assignment.seatNumber === 0 ? a.isCoxswain : !a.isCoxswain)
      );

      if (availableRowers.length === 0) return null;
      assignment.athleteId = availableRowers[0].id;
    }
  }

  // Ensure required athletes are included
  if (constraints.required) {
    for (const requiredId of constraints.required) {
      const isIncluded = fixed.some(a => a.athleteId === requiredId);
      if (!isIncluded) {
        // Find a seat to place this athlete
        const rowerSeats = fixed.filter(a => a.seatNumber > 0);
        if (rowerSeats.length === 0) return null;

        // Replace lowest scoring rower (not required)
        const replaceable = rowerSeats.find(
          a => !constraints.required.includes(a.athleteId)
        );

        if (replaceable) {
          replaceable.athleteId = requiredId;
        } else {
          return null; // Cannot place required athlete
        }
      }
    }
  }

  // Handle coxswain constraint
  if (config.hasCox && constraints.coxswain) {
    const coxSeat = fixed.find(a => a.seatNumber === 0);
    if (coxSeat) {
      // If wrong coxswain, swap
      if (coxSeat.athleteId !== constraints.coxswain) {
        const oldCoxId = coxSeat.athleteId;
        coxSeat.athleteId = constraints.coxswain;

        // If old cox is in rower seat, swap them
        const oldCoxInRower = fixed.find(
          a => a.athleteId === constraints.coxswain && a.seatNumber > 0
        );
        if (oldCoxInRower) {
          oldCoxInRower.athleteId = oldCoxId;
        }
      }
    } else {
      // Add coxswain seat
      fixed.push({
        athleteId: constraints.coxswain,
        seatNumber: 0,
        side: 'cox'
      });
    }
  }

  // Verify no duplicates
  const athleteIds = fixed.map(a => a.athleteId);
  const uniqueIds = new Set(athleteIds);
  if (uniqueIds.size !== athleteIds.length) {
    return null; // Duplicate athletes
  }

  return fixed;
}

/**
 * Generate optimal lineup using genetic algorithm
 * @param {string} teamId - Team ID
 * @param {string} boatClass - Boat class ('8+', '4+', '4-', '2-', '1x')
 * @param {Object} constraints - Lineup constraints
 * @param {Object} options - Algorithm options
 * @returns {Promise<Array>} - Top N lineups with fitness scores
 */
export async function generateOptimalLineup(teamId, boatClass, constraints = {}, options = {}) {
  const {
    generations = 100,
    populationSize = 50,
    mutationRate = 0.1,
    topN = 5
  } = options;

  // Fetch athletes with their scores
  const athletes = await prisma.athlete.findMany({
    where: { teamId },
    include: {
      rankings: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  // Map athletes to include combined scores
  const athleteScores = athletes.map(a => ({
    id: a.id,
    name: `${a.firstName} ${a.lastName}`,
    isCoxswain: a.isCoxswain || false,
    combinedScore: a.rankings[0]?.combinedScore || 50
  }));

  const config = getBoatConfig(boatClass);
  const requiredRowers = config.seats + (config.hasCox ? 1 : 0);

  // Check if we have enough athletes
  const availableAthletes = athleteScores.filter(
    a => !constraints.excluded?.includes(a.id)
  );

  if (availableAthletes.length < requiredRowers) {
    throw new Error(`Not enough athletes. Need ${requiredRowers}, have ${availableAthletes.length}`);
  }

  // Add boatClass to constraints for internal use
  const fullConstraints = { ...constraints, boatClass };

  // Generate initial population
  let population = generateInitialPopulation(
    athleteScores,
    boatClass,
    fullConstraints,
    populationSize
  );

  if (population.length === 0) {
    throw new Error('Could not generate valid initial population with given constraints');
  }

  // Evolution loop
  for (let gen = 0; gen < generations; gen++) {
    // Evaluate fitness for all individuals
    const fitnesses = population.map(lineup =>
      evaluateFitness(lineup, athleteScores, fullConstraints)
    );

    // Create next generation
    const nextPopulation = [];

    // Elitism: keep top performers
    const eliteCount = Math.max(2, Math.floor(populationSize * 0.1));
    const sortedIndices = fitnesses
      .map((f, i) => ({ fitness: f, index: i }))
      .sort((a, b) => b.fitness - a.fitness)
      .slice(0, eliteCount)
      .map(x => x.index);

    for (const idx of sortedIndices) {
      nextPopulation.push(population[idx]);
    }

    // Generate rest through crossover and mutation
    while (nextPopulation.length < populationSize) {
      const [parent1, parent2] = selectParents(population, fitnesses);
      let child = crossover(parent1, parent2);
      child = mutate(child, mutationRate);

      // Enforce constraints
      const validChild = enforceConstraints(child, fullConstraints, athleteScores);
      if (validChild) {
        nextPopulation.push(validChild);
      } else {
        // If invalid, add a random parent instead
        nextPopulation.push(Math.random() < 0.5 ? parent1 : parent2);
      }
    }

    population = nextPopulation;
  }

  // Final evaluation and ranking
  const finalFitnesses = population.map(lineup =>
    evaluateFitness(lineup, athleteScores, fullConstraints)
  );

  // Get unique top lineups
  const results = population
    .map((lineup, i) => ({
      lineup,
      fitness: finalFitnesses[i]
    }))
    .sort((a, b) => b.fitness - a.fitness);

  // Remove duplicates (same athlete assignments)
  const uniqueResults = [];
  const seen = new Set();

  for (const result of results) {
    const key = result.lineup
      .map(a => `${a.athleteId}-${a.seatNumber}`)
      .sort()
      .join('|');

    if (!seen.has(key)) {
      seen.add(key);

      // Enrich with athlete names
      const enrichedLineup = result.lineup.map(assignment => {
        const athlete = athleteScores.find(a => a.id === assignment.athleteId);
        return {
          ...assignment,
          athleteName: athlete?.name || 'Unknown',
          athleteScore: athlete?.combinedScore || 0
        };
      });

      uniqueResults.push({
        lineup: enrichedLineup.sort((a, b) => a.seatNumber - b.seatNumber),
        fitness: result.fitness,
        breakdown: {
          totalScore: enrichedLineup.reduce((sum, a) => sum + (a.athleteScore || 0), 0),
          averageScore: enrichedLineup.length > 0
            ? enrichedLineup.reduce((sum, a) => sum + (a.athleteScore || 0), 0) / enrichedLineup.length
            : 0
        }
      });

      if (uniqueResults.length >= topN) break;
    }
  }

  return uniqueResults;
}

export default {
  generateOptimalLineup,
  evaluateFitness,
  generateInitialPopulation,
  crossover,
  mutate,
  selectParents,
  enforceConstraints,
  getBoatConfig
};
