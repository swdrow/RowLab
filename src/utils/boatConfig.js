/**
 * Generate seat configuration for a boat
 * Odd seats (1,3,5,7) = Starboard (bow is seat 1)
 * Even seats (2,4,6,8) = Port (stroke is seat 8 in an 8+)
 *
 * @param {number} numSeats - Number of seats in the boat
 * @returns {Array} Array of seat configurations
 */
export const generateBoatConfig = (numSeats) => {
  return Array.from({ length: numSeats }, (_, i) => {
    const seatNumber = i + 1;
    return {
      seatNumber,
      side: seatNumber % 2 === 0 ? 'Port' : 'Starboard',
      athlete: null, // Initially unassigned
    };
  });
};

/**
 * Create a boat instance with unique ID
 * @param {object} boatConfig - Boat configuration (name, numSeats, hasCoxswain)
 * @param {string} instanceId - Unique identifier for this boat instance
 * @param {string} shellName - Actual shell name (e.g., "Seaweed", "Titanic")
 * @returns {object} Complete boat object with seats
 */
export const createBoatInstance = (boatConfig, instanceId, shellName = null) => {
  return {
    id: instanceId,
    boatClass: boatConfig.name, // e.g., "Varsity 8+"
    shellName: shellName, // e.g., "Seaweed"
    numSeats: boatConfig.numSeats,
    hasCoxswain: boatConfig.hasCoxswain,
    seats: generateBoatConfig(boatConfig.numSeats),
    coxswain: null, // Initially unassigned
    isExpanded: true, // Default to expanded view
  };
};

/**
 * Check if a boat lineup is complete (all seats filled)
 * @param {object} boat - Boat object
 * @returns {boolean} True if all seats and coxswain (if applicable) are filled
 */
export const isBoatComplete = (boat) => {
  const seatsComplete = boat.seats.every(seat => seat.athlete !== null);
  const coxswainComplete = !boat.hasCoxswain || boat.coxswain !== null;
  return seatsComplete && coxswainComplete;
};

/**
 * Validate if an athlete can row a specific seat (side matching)
 * @param {object} athlete - Athlete object with port/starboard capabilities
 * @param {object} seat - Seat object with side designation
 * @returns {object} { valid: boolean, warning: string }
 */
export const validateSeatAssignment = (athlete, seat) => {
  if (athlete.isCoxswain) {
    return { valid: true, warning: null };
  }

  const side = seat.side.toLowerCase();

  // Check if athlete has capability for this side
  if (side === 'port' && !athlete.port) {
    return {
      valid: true, // Allow assignment but warn
      warning: 'Athlete typically rows Starboard, assigned to Port seat'
    };
  }

  if (side === 'starboard' && !athlete.starboard) {
    return {
      valid: true, // Allow assignment but warn
      warning: 'Athlete typically rows Port, assigned to Starboard seat'
    };
  }

  return { valid: true, warning: null };
};

/**
 * Get all athletes assigned to boats
 * @param {Array} boats - Array of boat objects
 * @returns {Set} Set of athlete IDs currently assigned
 */
export const getAssignedAthletes = (boats) => {
  const assigned = new Set();

  boats.forEach(boat => {
    boat.seats.forEach(seat => {
      if (seat.athlete) {
        assigned.add(seat.athlete.id);
      }
    });

    if (boat.coxswain) {
      assigned.add(boat.coxswain.id);
    }
  });

  return assigned;
};

/**
 * Find an athlete's current position
 * @param {Array} boats - Array of boat objects
 * @param {string} athleteId - Athlete ID to find
 * @returns {object|null} { boatId, seatNumber, isCoxswain } or null
 */
export const findAthletePosition = (boats, athleteId) => {
  for (const boat of boats) {
    // Check seats
    for (const seat of boat.seats) {
      if (seat.athlete && seat.athlete.id === athleteId) {
        return {
          boatId: boat.id,
          seatNumber: seat.seatNumber,
          isCoxswain: false
        };
      }
    }

    // Check coxswain
    if (boat.coxswain && boat.coxswain.id === athleteId) {
      return {
        boatId: boat.id,
        seatNumber: null,
        isCoxswain: true
      };
    }
  }

  return null;
};
