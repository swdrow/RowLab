/**
 * Margin Calculation Service
 *
 * Implements the margin swing formula for seat racing analysis:
 * - Swing = Margin₂ - Margin₁
 * - Performance_Diff = Swing ÷ 2
 */

/**
 * Calculate the margin between two boats
 * Positive margin means boat1 wins (finished faster)
 *
 * @param {number} boat1Time - Boat 1 finish time in seconds
 * @param {number} boat2Time - Boat 2 finish time in seconds
 * @param {number} [boat1Handicap=0] - Handicap adjustment for boat 1 (subtracted from time)
 * @param {number} [boat2Handicap=0] - Handicap adjustment for boat 2 (subtracted from time)
 * @returns {number} Margin in seconds (positive = boat1 wins)
 */
function calculateMargin(boat1Time, boat2Time, boat1Handicap = 0, boat2Handicap = 0) {
  const adjustedBoat1Time = boat1Time - boat1Handicap;
  const adjustedBoat2Time = boat2Time - boat2Handicap;

  // Margin is boat2 - boat1 because lower time is better
  // Positive margin means boat1 finished first (won)
  return adjustedBoat2Time - adjustedBoat1Time;
}

/**
 * Calculate the swing (change in margin) between two pieces
 * Positive swing means margin increased (boat1 improved relative to boat2)
 *
 * @param {number} margin1 - Margin from first piece (baseline)
 * @param {number} margin2 - Margin from second piece (after swap)
 * @returns {number} Swing value in seconds
 */
function calculateSwing(margin1, margin2) {
  return margin2 - margin1;
}

/**
 * Estimate the individual performance difference from swing
 * This represents each swapped athlete's contribution to the swing
 *
 * @param {number} swing - The swing value from calculateSwing
 * @returns {number} Performance difference per athlete (swing / 2)
 */
function estimatePerformanceDiff(swing) {
  return swing / 2;
}

/**
 * Find which athletes were swapped between two sets of boats
 *
 * @param {Array<{name: string, athletes: string[]}>} boats1 - Boats from piece 1
 * @param {Array<{name: string, athletes: string[]}>} boats2 - Boats from piece 2
 * @returns {{swapped: Array<{athlete: string, fromBoat: string, toBoat: string}>, unchanged: string[]}}
 */
function findSwappedAthletes(boats1, boats2) {
  const swapped = [];
  const unchanged = [];

  // Create maps of athlete -> boat for each piece
  const athleteToBoat1 = new Map();
  const athleteToBoat2 = new Map();

  for (const boat of boats1) {
    for (const athlete of boat.athletes || []) {
      athleteToBoat1.set(athlete, boat.name);
    }
  }

  for (const boat of boats2) {
    for (const athlete of boat.athletes || []) {
      athleteToBoat2.set(athlete, boat.name);
    }
  }

  // Find athletes who changed boats
  for (const [athlete, boat1Name] of athleteToBoat1) {
    const boat2Name = athleteToBoat2.get(athlete);

    if (boat2Name && boat2Name !== boat1Name) {
      swapped.push({
        athlete,
        fromBoat: boat1Name,
        toBoat: boat2Name
      });
    } else if (boat2Name === boat1Name) {
      unchanged.push(athlete);
    }
  }

  return { swapped, unchanged };
}

/**
 * Sort boats consistently by name for reliable margin calculations
 *
 * @param {Array<{name: string, time: number, handicap?: number}>} boats
 * @returns {Array<{name: string, time: number, handicap?: number}>}
 */
function sortBoatsByName(boats) {
  return [...boats].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Analyze a pair of pieces (baseline + swap)
 *
 * @param {Array<{name: string, time: number, handicap?: number, athletes?: string[]}>} piece1Boats - Boats from baseline piece
 * @param {Array<{name: string, time: number, handicap?: number, athletes?: string[]}>} piece2Boats - Boats from swap piece
 * @param {Array<{athlete: string, fromBoat: string, toBoat: string}>} [swappedAthletes] - Pre-computed swapped athletes (optional)
 * @returns {{
 *   margin1: number,
 *   margin2: number,
 *   swing: number,
 *   performanceDiff: number,
 *   boat1Name: string,
 *   boat2Name: string,
 *   swappedAthletes: Array<{athlete: string, fromBoat: string, toBoat: string}>,
 *   interpretation: string
 * }}
 */
function analyzePiecePair(piece1Boats, piece2Boats, swappedAthletes = null) {
  // Sort boats consistently by name
  const sorted1 = sortBoatsByName(piece1Boats);
  const sorted2 = sortBoatsByName(piece2Boats);

  if (sorted1.length < 2 || sorted2.length < 2) {
    throw new Error('Each piece must have at least 2 boats for margin analysis');
  }

  const boat1Name = sorted1[0].name;
  const boat2Name = sorted1[1].name;

  // Calculate margins (boat1 vs boat2)
  const margin1 = calculateMargin(
    sorted1[0].time,
    sorted1[1].time,
    sorted1[0].handicap || 0,
    sorted1[1].handicap || 0
  );

  const margin2 = calculateMargin(
    sorted2[0].time,
    sorted2[1].time,
    sorted2[0].handicap || 0,
    sorted2[1].handicap || 0
  );

  // Calculate swing and performance difference
  const swing = calculateSwing(margin1, margin2);
  const performanceDiff = estimatePerformanceDiff(swing);

  // Find swapped athletes if not provided
  const swaps = swappedAthletes || findSwappedAthletes(piece1Boats, piece2Boats).swapped;

  // Generate interpretation
  const interpretation = generateInterpretation(
    boat1Name,
    boat2Name,
    margin1,
    margin2,
    swing,
    performanceDiff,
    swaps
  );

  return {
    margin1,
    margin2,
    swing,
    performanceDiff,
    boat1Name,
    boat2Name,
    swappedAthletes: swaps,
    interpretation
  };
}

/**
 * Generate a human-readable interpretation of the analysis
 *
 * @param {string} boat1Name
 * @param {string} boat2Name
 * @param {number} margin1
 * @param {number} margin2
 * @param {number} swing
 * @param {number} performanceDiff
 * @param {Array<{athlete: string, fromBoat: string, toBoat: string}>} swappedAthletes
 * @returns {string}
 */
function generateInterpretation(boat1Name, boat2Name, margin1, margin2, swing, performanceDiff, swappedAthletes) {
  const formatTime = (seconds) => {
    const absSeconds = Math.abs(seconds);
    return `${absSeconds.toFixed(2)}s`;
  };

  const parts = [];

  // Describe the margins
  const margin1Winner = margin1 >= 0 ? boat1Name : boat2Name;
  const margin2Winner = margin2 >= 0 ? boat1Name : boat2Name;

  parts.push(`Piece 1: ${margin1Winner} won by ${formatTime(margin1)}`);
  parts.push(`Piece 2: ${margin2Winner} won by ${formatTime(margin2)}`);

  // Describe the swing
  if (Math.abs(swing) < 0.1) {
    parts.push(`Swing: Negligible (${formatTime(swing)})`);
  } else {
    const swingDirection = swing > 0 ? `toward ${boat1Name}` : `toward ${boat2Name}`;
    parts.push(`Swing: ${formatTime(swing)} ${swingDirection}`);
  }

  // Describe the swapped athletes and their performance
  if (swappedAthletes && swappedAthletes.length > 0) {
    const athleteNames = swappedAthletes.map(s => s.athlete).join(' and ');

    if (Math.abs(performanceDiff) < 0.1) {
      parts.push(`${athleteNames}: No significant performance difference`);
    } else {
      // Determine who performed better
      // If swing is positive (boat1 improved), the athlete who moved TO boat1 performed better
      const athleteToBoat1 = swappedAthletes.find(s => s.toBoat === boat1Name);
      const athleteToBoat2 = swappedAthletes.find(s => s.toBoat === boat2Name);

      if (athleteToBoat1 && athleteToBoat2) {
        const betterAthlete = swing > 0 ? athleteToBoat1.athlete : athleteToBoat2.athlete;
        const worseAthlete = swing > 0 ? athleteToBoat2.athlete : athleteToBoat1.athlete;
        parts.push(`${betterAthlete} outperformed ${worseAthlete} by ${formatTime(Math.abs(performanceDiff))} per piece`);
      } else {
        parts.push(`Performance difference: ${formatTime(performanceDiff)} per athlete`);
      }
    }
  }

  return parts.join('. ');
}

/**
 * Analyze all consecutive piece pairs in a session
 * Pairs are: (piece 0, piece 1), (piece 2, piece 3), (piece 4, piece 5), etc.
 *
 * @param {{pieces: Array<{boats: Array<{name: string, time: number, handicap?: number, athletes?: string[]}>}>}} session
 * @returns {Array<{
 *   pieceIndices: [number, number],
 *   margin1: number,
 *   margin2: number,
 *   swing: number,
 *   performanceDiff: number,
 *   boat1Name: string,
 *   boat2Name: string,
 *   swappedAthletes: Array<{athlete: string, fromBoat: string, toBoat: string}>,
 *   interpretation: string
 * }>}
 */
function analyzeSession(session) {
  if (!session || !session.pieces || session.pieces.length < 2) {
    return [];
  }

  const results = [];

  // Loop through consecutive pairs: (0,1), (2,3), (4,5), etc.
  for (let i = 0; i < session.pieces.length - 1; i += 2) {
    const piece1 = session.pieces[i];
    const piece2 = session.pieces[i + 1];

    if (!piece1.boats || !piece2.boats) {
      continue;
    }

    try {
      // Find swapped athletes
      const { swapped } = findSwappedAthletes(piece1.boats, piece2.boats);

      // Analyze the pair
      const analysis = analyzePiecePair(piece1.boats, piece2.boats, swapped);

      results.push({
        pieceIndices: [i, i + 1],
        ...analysis
      });
    } catch (error) {
      // Skip pairs that can't be analyzed (e.g., not enough boats)
      console.warn(`Could not analyze pieces ${i} and ${i + 1}: ${error.message}`);
    }
  }

  return results;
}

module.exports = {
  calculateMargin,
  calculateSwing,
  estimatePerformanceDiff,
  findSwappedAthletes,
  analyzePiecePair,
  analyzeSession
};
