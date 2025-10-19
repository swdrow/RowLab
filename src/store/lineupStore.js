import { create } from 'zustand';
import { createBoatInstance, getAssignedAthletes, findAthletePosition } from '../utils/boatConfig';

/**
 * Zustand store for managing lineup state
 * Chosen for simplicity and performance over Context API
 */
const useLineupStore = create((set, get) => ({
  // Data
  athletes: [],
  boatConfigs: [],
  shells: [],
  activeBoats: [],
  ergData: [],
  lineupName: '',

  // Selection state
  selectedAthlete: null,
  selectedSeats: [], // For swapping: [{ boatId, seatNumber, isCoxswain }]

  // UI state
  headshotMap: new Map(),

  // Actions

  /**
   * Initialize athletes data
   */
  setAthletes: (athletes) => set({ athletes }),

  /**
   * Initialize boat configurations
   */
  setBoatConfigs: (configs) => set({ boatConfigs: configs }),

  /**
   * Initialize shell names
   */
  setShells: (shells) => set({ shells }),

  /**
   * Initialize erg data (for future use)
   */
  setErgData: (data) => set({ ergData: data }),

  /**
   * Set lineup name
   */
  setLineupName: (name) => set({ lineupName: name }),

  /**
   * Set preloaded headshot URLs
   */
  setHeadshotMap: (map) => set({ headshotMap: map }),

  /**
   * Add a new boat to the workspace
   */
  addBoat: (boatConfig, shellName = null) => {
    const timestamp = Date.now();
    const instanceId = `boat-${timestamp}`;
    const newBoat = createBoatInstance(boatConfig, instanceId, shellName);

    set(state => ({
      activeBoats: [...state.activeBoats, newBoat]
    }));
  },

  /**
   * Toggle boat expanded state
   */
  toggleBoatExpanded: (boatId) => {
    set(state => ({
      activeBoats: state.activeBoats.map(boat =>
        boat.id === boatId
          ? { ...boat, isExpanded: !boat.isExpanded }
          : boat
      )
    }));
  },

  /**
   * Remove a boat from the workspace
   */
  removeBoat: (boatId) => {
    set(state => ({
      activeBoats: state.activeBoats.filter(boat => boat.id !== boatId),
      selectedSeats: state.selectedSeats.filter(s => s.boatId !== boatId)
    }));
  },

  /**
   * Select an athlete from the bank
   */
  selectAthlete: (athlete) => {
    set({ selectedAthlete: athlete });
  },

  /**
   * Clear athlete selection
   */
  clearAthleteSelection: () => {
    set({ selectedAthlete: null });
  },

  /**
   * Assign an athlete to a seat
   */
  assignToSeat: (boatId, seatNumber, athlete) => {
    set(state => {
      const activeBoats = state.activeBoats.map(boat => {
        if (boat.id === boatId) {
          const seats = boat.seats.map(seat => {
            if (seat.seatNumber === seatNumber) {
              return { ...seat, athlete };
            }
            return seat;
          });
          return { ...boat, seats };
        }
        return boat;
      });

      return {
        activeBoats,
        selectedAthlete: null
      };
    });
  },

  /**
   * Assign an athlete to coxswain position
   */
  assignToCoxswain: (boatId, athlete) => {
    set(state => {
      const activeBoats = state.activeBoats.map(boat => {
        if (boat.id === boatId) {
          return { ...boat, coxswain: athlete };
        }
        return boat;
      });

      return {
        activeBoats,
        selectedAthlete: null
      };
    });
  },

  /**
   * Remove athlete from a seat
   */
  removeFromSeat: (boatId, seatNumber) => {
    set(state => {
      const activeBoats = state.activeBoats.map(boat => {
        if (boat.id === boatId) {
          const seats = boat.seats.map(seat => {
            if (seat.seatNumber === seatNumber) {
              return { ...seat, athlete: null };
            }
            return seat;
          });
          return { ...boat, seats };
        }
        return boat;
      });

      return { activeBoats };
    });
  },

  /**
   * Remove athlete from coxswain position
   */
  removeFromCoxswain: (boatId) => {
    set(state => {
      const activeBoats = state.activeBoats.map(boat => {
        if (boat.id === boatId) {
          return { ...boat, coxswain: null };
        }
        return boat;
      });

      return { activeBoats };
    });
  },

  /**
   * Toggle seat selection for swapping
   */
  toggleSeatSelection: (boatId, seatNumber, isCoxswain = false) => {
    set(state => {
      const selectionKey = `${boatId}-${isCoxswain ? 'cox' : seatNumber}`;
      const existing = state.selectedSeats.find(
        s => s.boatId === boatId &&
             (isCoxswain ? s.isCoxswain : s.seatNumber === seatNumber)
      );

      if (existing) {
        // Deselect
        return {
          selectedSeats: state.selectedSeats.filter(s => s !== existing)
        };
      } else {
        // Select (max 2 seats for swapping)
        const newSelection = { boatId, seatNumber, isCoxswain };
        const selectedSeats = state.selectedSeats.length >= 2
          ? [state.selectedSeats[1], newSelection]
          : [...state.selectedSeats, newSelection];

        return { selectedSeats };
      }
    });
  },

  /**
   * Swap two selected athletes
   */
  swapAthletes: () => {
    const state = get();
    if (state.selectedSeats.length !== 2) return;

    const [seat1, seat2] = state.selectedSeats;

    // Get athletes from both positions
    const boat1 = state.activeBoats.find(b => b.id === seat1.boatId);
    const boat2 = state.activeBoats.find(b => b.id === seat2.boatId);

    if (!boat1 || !boat2) return;

    const athlete1 = seat1.isCoxswain
      ? boat1.coxswain
      : boat1.seats.find(s => s.seatNumber === seat1.seatNumber)?.athlete;

    const athlete2 = seat2.isCoxswain
      ? boat2.coxswain
      : boat2.seats.find(s => s.seatNumber === seat2.seatNumber)?.athlete;

    // Swap
    set(state => {
      const activeBoats = state.activeBoats.map(boat => {
        if (boat.id === seat1.boatId) {
          if (seat1.isCoxswain) {
            return { ...boat, coxswain: athlete2 };
          } else {
            const seats = boat.seats.map(s => {
              if (s.seatNumber === seat1.seatNumber) {
                return { ...s, athlete: athlete2 };
              }
              return s;
            });
            return { ...boat, seats };
          }
        }

        if (boat.id === seat2.boatId) {
          if (seat2.isCoxswain) {
            return { ...boat, coxswain: athlete1 };
          } else {
            const seats = boat.seats.map(s => {
              if (s.seatNumber === seat2.seatNumber) {
                return { ...s, athlete: athlete1 };
              }
              return s;
            });
            return { ...boat, seats };
          }
        }

        return boat;
      });

      return {
        activeBoats,
        selectedSeats: []
      };
    });
  },

  /**
   * Clear seat selections
   */
  clearSeatSelection: () => {
    set({ selectedSeats: [] });
  },

  /**
   * Get list of available (unassigned) athletes
   */
  getAvailableAthletes: () => {
    const state = get();
    const assigned = getAssignedAthletes(state.activeBoats);
    return state.athletes.filter(athlete => !assigned.has(athlete.id));
  },

  /**
   * Export current lineup to JSON
   */
  exportLineup: () => {
    const state = get();
    return {
      timestamp: new Date().toISOString(),
      boats: state.activeBoats.map(boat => ({
        name: boat.name,
        seats: boat.seats.map(seat => ({
          seatNumber: seat.seatNumber,
          side: seat.side,
          athlete: seat.athlete ? {
            lastName: seat.athlete.lastName,
            firstName: seat.athlete.firstName,
            country: seat.athlete.country
          } : null
        })),
        coxswain: boat.coxswain ? {
          lastName: boat.coxswain.lastName,
          firstName: boat.coxswain.firstName,
          country: boat.coxswain.country
        } : null
      }))
    };
  },

  /**
   * Save lineup to localStorage
   */
  saveLineup: (name) => {
    const lineup = get().exportLineup();
    const saved = JSON.parse(localStorage.getItem('rowlab_lineups') || '{}');
    saved[name] = lineup;
    localStorage.setItem('rowlab_lineups', JSON.stringify(saved));
  },

  /**
   * List saved lineups
   */
  getSavedLineups: () => {
    return JSON.parse(localStorage.getItem('rowlab_lineups') || '{}');
  }
}));

export default useLineupStore;
