import { create } from 'zustand';
import { createBoatInstance, getAssignedAthletes, findAthletePosition } from '../utils/boatConfig';
import { undoMiddleware } from './undoMiddleware';
import useAuthStore from './authStore';

/**
 * DEPRECATED - Phase 25-06
 *
 * This V1 store is being migrated to V2 hooks and stores:
 * - Server state (lineups, assignments) → useLineupDraft hook (src/v2/hooks/useLineupDraft.ts)
 * - UI state (selections, drag, undo) → useLineupBuilderStore (src/v2/stores/lineupBuilderStore.ts)
 *
 * V1 components still reference this store. Do NOT add new functionality here.
 * New lineup builder features should use the V2 hooks and stores.
 *
 * TODO(phase-25-07): Complete V1 → V2 component migration and delete this file
 */

/**
 * Zustand store for managing lineup state
 *
 * Features:
 * - Undo/Redo support for activeBoats changes (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z)
 * - Athlete assignment and swapping
 * - Multiple boat management
 * - Export/import functionality
 */
const useLineupStore = create(
  undoMiddleware({
    trackedKeys: ['activeBoats'], // Only track activeBoats for undo/redo
    historyLimit: 50, // Keep last 50 states
  })((set, get) => ({
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

      set((state) => ({
        activeBoats: [...state.activeBoats, newBoat],
      }));
    },

    /**
     * Toggle boat expanded state
     */
    toggleBoatExpanded: (boatId) => {
      set((state) => ({
        activeBoats: state.activeBoats.map((boat) =>
          boat.id === boatId ? { ...boat, isExpanded: !boat.isExpanded } : boat
        ),
      }));
    },

    /**
     * Remove a boat from the workspace
     */
    removeBoat: (boatId) => {
      set((state) => ({
        activeBoats: state.activeBoats.filter((boat) => boat.id !== boatId),
        selectedSeats: state.selectedSeats.filter((s) => s.boatId !== boatId),
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
      set((state) => {
        const activeBoats = state.activeBoats.map((boat) => {
          if (boat.id === boatId) {
            const seats = boat.seats.map((seat) => {
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
          selectedAthlete: null,
        };
      });
    },

    /**
     * Assign an athlete to coxswain position
     */
    assignToCoxswain: (boatId, athlete) => {
      set((state) => {
        const activeBoats = state.activeBoats.map((boat) => {
          if (boat.id === boatId) {
            return { ...boat, coxswain: athlete };
          }
          return boat;
        });

        return {
          activeBoats,
          selectedAthlete: null,
        };
      });
    },

    /**
     * Remove athlete from a seat
     */
    removeFromSeat: (boatId, seatNumber) => {
      set((state) => {
        const activeBoats = state.activeBoats.map((boat) => {
          if (boat.id === boatId) {
            const seats = boat.seats.map((seat) => {
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
      set((state) => {
        const activeBoats = state.activeBoats.map((boat) => {
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
      set((state) => {
        const selectionKey = `${boatId}-${isCoxswain ? 'cox' : seatNumber}`;
        const existing = state.selectedSeats.find(
          (s) => s.boatId === boatId && (isCoxswain ? s.isCoxswain : s.seatNumber === seatNumber)
        );

        if (existing) {
          // Deselect
          return {
            selectedSeats: state.selectedSeats.filter((s) => s !== existing),
          };
        } else {
          // Select (max 2 seats for swapping)
          const newSelection = { boatId, seatNumber, isCoxswain };
          const selectedSeats =
            state.selectedSeats.length >= 2
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
      const boat1 = state.activeBoats.find((b) => b.id === seat1.boatId);
      const boat2 = state.activeBoats.find((b) => b.id === seat2.boatId);

      if (!boat1 || !boat2) return;

      const athlete1 = seat1.isCoxswain
        ? boat1.coxswain
        : boat1.seats.find((s) => s.seatNumber === seat1.seatNumber)?.athlete;

      const athlete2 = seat2.isCoxswain
        ? boat2.coxswain
        : boat2.seats.find((s) => s.seatNumber === seat2.seatNumber)?.athlete;

      // Swap - handle same boat case separately
      set((state) => {
        const sameBoat = seat1.boatId === seat2.boatId;

        const activeBoats = state.activeBoats.map((boat) => {
          // Handle same boat swap
          if (sameBoat && boat.id === seat1.boatId) {
            let updatedBoat = { ...boat };

            // Update first position
            if (seat1.isCoxswain) {
              updatedBoat.coxswain = athlete2;
            } else {
              updatedBoat.seats = updatedBoat.seats.map((s) =>
                s.seatNumber === seat1.seatNumber ? { ...s, athlete: athlete2 } : s
              );
            }

            // Update second position
            if (seat2.isCoxswain) {
              updatedBoat.coxswain = athlete1;
            } else {
              updatedBoat.seats = updatedBoat.seats.map((s) =>
                s.seatNumber === seat2.seatNumber ? { ...s, athlete: athlete1 } : s
              );
            }

            return updatedBoat;
          }

          // Handle different boat swaps
          if (!sameBoat) {
            if (boat.id === seat1.boatId) {
              if (seat1.isCoxswain) {
                return { ...boat, coxswain: athlete2 };
              } else {
                const seats = boat.seats.map((s) => {
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
                const seats = boat.seats.map((s) => {
                  if (s.seatNumber === seat2.seatNumber) {
                    return { ...s, athlete: athlete1 };
                  }
                  return s;
                });
                return { ...boat, seats };
              }
            }
          }

          return boat;
        });

        return {
          activeBoats,
          selectedSeats: [],
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
      return state.athletes.filter((athlete) => !assigned.has(athlete.id));
    },

    /**
     * Export current lineup to JSON
     */
    exportLineup: () => {
      const state = get();
      return {
        timestamp: new Date().toISOString(),
        boats: state.activeBoats.map((boat) => ({
          name: boat.name,
          seats: boat.seats.map((seat) => ({
            seatNumber: seat.seatNumber,
            side: seat.side,
            athlete: seat.athlete
              ? {
                  lastName: seat.athlete.lastName,
                  firstName: seat.athlete.firstName,
                  country: seat.athlete.country,
                }
              : null,
          })),
          coxswain: boat.coxswain
            ? {
                lastName: boat.coxswain.lastName,
                firstName: boat.coxswain.firstName,
                country: boat.coxswain.country,
              }
            : null,
        })),
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
    },

    /**
     * Load lineup from saved data (database or localStorage)
     */
    loadLineupFromData: (lineup, athletes, boatConfigs, shells) => {
      set((state) => {
        const newActiveBoats = [];

        // For database lineups, reconstruct from assignments
        if (lineup.assignments && Array.isArray(lineup.assignments)) {
          // Group assignments by boat class and shell name
          const boatGroups = {};
          for (const assignment of lineup.assignments) {
            const key = `${assignment.boatClass}-${assignment.shellName || 'default'}`;
            if (!boatGroups[key]) {
              boatGroups[key] = {
                boatClass: assignment.boatClass,
                shellName: assignment.shellName,
                assignments: [],
              };
            }
            boatGroups[key].assignments.push(assignment);
          }

          // Create boats from groups
          for (const group of Object.values(boatGroups)) {
            const boatConfig = boatConfigs.find((b) => b.name === group.boatClass);
            if (!boatConfig) continue;

            const timestamp = Date.now() + Math.random();
            const boat = {
              id: `boat-${timestamp}`,
              name: group.boatClass,
              shellName: group.shellName,
              numSeats: boatConfig.numSeats,
              hasCoxswain: boatConfig.hasCoxswain,
              isExpanded: true,
              seats: [],
              coxswain: null,
            };

            // Create seats
            for (let i = boatConfig.numSeats; i >= 1; i--) {
              const side = i % 2 === 0 ? 'Port' : 'Starboard';
              boat.seats.push({
                seatNumber: i,
                side,
                athlete: null,
              });
            }

            // Fill in assignments
            for (const assignment of group.assignments) {
              if (assignment.isCoxswain) {
                const athlete = athletes.find((a) => a.id === assignment.athleteId);
                boat.coxswain = athlete || null;
              } else {
                const seatIndex = boat.seats.findIndex(
                  (s) => s.seatNumber === assignment.seatNumber
                );
                if (seatIndex !== -1) {
                  const athlete = athletes.find((a) => a.id === assignment.athleteId);
                  boat.seats[seatIndex].athlete = athlete || null;
                  if (assignment.side) {
                    boat.seats[seatIndex].side = assignment.side;
                  }
                }
              }
            }

            newActiveBoats.push(boat);
          }
        }
        // For local storage lineups, use boats array format
        else if (lineup.boats && Array.isArray(lineup.boats)) {
          for (const savedBoat of lineup.boats) {
            // Find matching athlete by name
            const findAthlete = (saved) => {
              if (!saved) return null;
              return (
                athletes.find(
                  (a) => a.lastName === saved.lastName && a.firstName === saved.firstName
                ) || null
              );
            };

            const boatConfig = boatConfigs.find((b) => b.name === savedBoat.name);
            if (!boatConfig) continue;

            const timestamp = Date.now() + Math.random();
            const boat = {
              id: `boat-${timestamp}`,
              name: savedBoat.name,
              shellName: savedBoat.shellName || null,
              numSeats: boatConfig.numSeats,
              hasCoxswain: boatConfig.hasCoxswain,
              isExpanded: true,
              seats:
                savedBoat.seats?.map((s) => ({
                  seatNumber: s.seatNumber,
                  side: s.side,
                  athlete: findAthlete(s.athlete),
                })) || [],
              coxswain: findAthlete(savedBoat.coxswain),
            };

            newActiveBoats.push(boat);
          }
        }

        return {
          activeBoats: newActiveBoats,
          lineupName: lineup.name || '',
          selectedSeats: [],
        };
      });
    },

    /**
     * Clear current lineup
     */
    clearLineup: () => {
      set({
        activeBoats: [],
        lineupName: '',
        selectedSeats: [],
        selectedAthlete: null,
      });
    },

    // ============================================
    // API Integration Methods
    // ============================================

    // Track current lineup ID for updates
    currentLineupId: null,
    setCurrentLineupId: (id) => set({ currentLineupId: id }),

    /**
     * Fetch lineups from API
     */
    fetchLineups: async () => {
      try {
        const { authenticatedFetch } = useAuthStore.getState();
        const response = await authenticatedFetch('/api/v1/lineups');
        const data = await response.json();
        if (data.success) {
          return data.data.lineups;
        }
        throw new Error(data.error?.message || 'Failed to fetch lineups');
      } catch (error) {
        console.error('Fetch lineups error:', error);
        throw error;
      }
    },

    /**
     * Load lineup from API by ID
     */
    fetchLineupById: async (lineupId) => {
      try {
        const { authenticatedFetch } = useAuthStore.getState();
        const response = await authenticatedFetch(`/api/v1/lineups/${lineupId}`);
        const data = await response.json();
        if (data.success) {
          return data.data.lineup;
        }
        throw new Error(data.error?.message || 'Failed to fetch lineup');
      } catch (error) {
        console.error('Fetch lineup error:', error);
        throw error;
      }
    },

    /**
     * Save current lineup to API
     */
    saveLineupToAPI: async (name, notes = '') => {
      const state = get();
      const assignments = [];

      // Convert activeBoats to assignments
      for (const boat of state.activeBoats) {
        // Add seat assignments
        for (const seat of boat.seats) {
          if (seat.athlete) {
            assignments.push({
              athleteId: seat.athlete.id,
              boatClass: boat.name,
              shellName: boat.shellName || null,
              seatNumber: seat.seatNumber,
              side: seat.side,
              isCoxswain: false,
            });
          }
        }
        // Add coxswain
        if (boat.coxswain) {
          assignments.push({
            athleteId: boat.coxswain.id,
            boatClass: boat.name,
            shellName: boat.shellName || null,
            seatNumber: 0,
            side: 'Port',
            isCoxswain: true,
          });
        }
      }

      try {
        const { authenticatedFetch } = useAuthStore.getState();
        const response = await authenticatedFetch('/api/v1/lineups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, notes, assignments }),
        });
        const data = await response.json();
        if (data.success) {
          set({ lineupName: name });
          return data.data.lineup;
        }
        throw new Error(data.error?.message || 'Failed to save lineup');
      } catch (error) {
        console.error('Save lineup error:', error);
        throw error;
      }
    },

    /**
     * Update existing lineup in API
     */
    updateLineupInAPI: async (lineupId, name, notes = '') => {
      const state = get();
      const assignments = [];

      for (const boat of state.activeBoats) {
        for (const seat of boat.seats) {
          if (seat.athlete) {
            assignments.push({
              athleteId: seat.athlete.id,
              boatClass: boat.name,
              shellName: boat.shellName || null,
              seatNumber: seat.seatNumber,
              side: seat.side,
              isCoxswain: false,
            });
          }
        }
        if (boat.coxswain) {
          assignments.push({
            athleteId: boat.coxswain.id,
            boatClass: boat.name,
            shellName: boat.shellName || null,
            seatNumber: 0,
            side: 'Port',
            isCoxswain: true,
          });
        }
      }

      try {
        const { authenticatedFetch } = useAuthStore.getState();
        const response = await authenticatedFetch(`/api/v1/lineups/${lineupId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, notes, assignments }),
        });
        const data = await response.json();
        if (data.success) {
          set({ lineupName: name });
          return data.data.lineup;
        }
        throw new Error(data.error?.message || 'Failed to update lineup');
      } catch (error) {
        console.error('Update lineup error:', error);
        throw error;
      }
    },

    /**
     * Delete lineup from API
     */
    deleteLineupFromAPI: async (lineupId) => {
      try {
        const { authenticatedFetch } = useAuthStore.getState();
        const response = await authenticatedFetch(`/api/v1/lineups/${lineupId}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (data.success) {
          return true;
        }
        throw new Error(data.error?.message || 'Failed to delete lineup');
      } catch (error) {
        console.error('Delete lineup error:', error);
        throw error;
      }
    },

    /**
     * Duplicate lineup via API
     */
    duplicateLineupInAPI: async (lineupId, newName) => {
      try {
        const { authenticatedFetch } = useAuthStore.getState();
        const response = await authenticatedFetch(`/api/v1/lineups/${lineupId}/duplicate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newName }),
        });
        const data = await response.json();
        if (data.success) {
          return data.data.lineup;
        }
        throw new Error(data.error?.message || 'Failed to duplicate lineup');
      } catch (error) {
        console.error('Duplicate lineup error:', error);
        throw error;
      }
    },

    /**
     * Get lineup export data from API
     */
    getLineupExportData: async (lineupId) => {
      try {
        const { authenticatedFetch } = useAuthStore.getState();
        const response = await authenticatedFetch(`/api/v1/lineups/${lineupId}/export`);
        const data = await response.json();
        if (data.success) {
          return data.data;
        }
        throw new Error(data.error?.message || 'Failed to get export data');
      } catch (error) {
        console.error('Get export data error:', error);
        throw error;
      }
    },

    /**
     * Update shell name for a boat
     */
    updateBoatShell: (boatId, shellName) => {
      set((state) => ({
        activeBoats: state.activeBoats.map((boat) =>
          boat.id === boatId ? { ...boat, shellName } : boat
        ),
      }));
    },

    // Note: undo(), redo(), _history, checkpoint(), clearHistory()
    // are automatically provided by undoMiddleware
  }))
);

export default useLineupStore;
