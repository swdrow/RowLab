import { create } from 'zustand';

/**
 * Zustand store for managing training plans
 *
 * Features:
 * - CRUD operations for training plans
 * - Workout management within plans
 * - Athlete assignments
 * - Template management
 * - Training load tracking
 */
const useTrainingPlanStore = create((set, get) => ({
  // Data
  plans: [],
  selectedPlan: null,
  selectedWorkout: null,
  templates: [],
  athletePlans: [],
  trainingLoad: null,

  // UI state
  loading: false,
  error: null,

  // ============================================
  // Helper: Get auth headers
  // ============================================
  _getAuthHeaders: () => {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  // ============================================
  // Helper: Handle API response
  // ============================================
  _handleResponse: async (response) => {
    if (!response.ok) {
      let message = `Request failed: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        message = errorData.error?.message || errorData.message || message;
      } catch {
        // If JSON parse fails, try to get text
        try {
          const text = await response.text();
          if (text && text.length < 200) {
            message = text;
          }
        } catch {
          // Stick with status message
        }
      }
      throw new Error(message);
    }
    return response.json();
  },

  // ============================================
  // Plan CRUD Operations
  // ============================================

  /**
   * Fetch all training plans
   */
  fetchPlans: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const params = new URLSearchParams();
      if (filters.isTemplate !== undefined) params.set('isTemplate', filters.isTemplate);
      if (filters.phase) params.set('phase', filters.phase);
      if (filters.limit) params.set('limit', filters.limit);

      const url = `/api/v1/training-plans${params.toString() ? '?' + params : ''}`;
      const response = await fetch(url, { headers });
      const data = await get()._handleResponse(response);

      if (data.success) {
        set({ plans: data.data.plans || [], loading: false });
        return data.data.plans;
      }
      throw new Error(data.error?.message || 'Failed to fetch plans');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Fetch a single plan by ID
   */
  fetchPlan: async (planId) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/training-plans/${planId}`, { headers });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const plan = data.data.plan;
        set({ selectedPlan: plan, loading: false });
        return plan;
      }
      throw new Error(data.error?.message || 'Failed to fetch plan');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Create a new training plan
   */
  createPlan: async (planData) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch('/api/v1/training-plans', {
        method: 'POST',
        headers,
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const plan = data.data.plan;
        set((state) => ({
          plans: [plan, ...state.plans],
          selectedPlan: plan,
          loading: false,
        }));
        return plan;
      }
      throw new Error(data.error?.message || 'Failed to create plan');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Update an existing plan
   */
  updatePlan: async (planId, updates) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/training-plans/${planId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const plan = data.data.plan;
        set((state) => ({
          plans: state.plans.map((p) => (p.id === planId ? plan : p)),
          selectedPlan: state.selectedPlan?.id === planId ? plan : state.selectedPlan,
          loading: false,
        }));
        return plan;
      }
      throw new Error(data.error?.message || 'Failed to update plan');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Delete a plan
   */
  deletePlan: async (planId) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/training-plans/${planId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        set((state) => ({
          plans: state.plans.filter((p) => p.id !== planId),
          selectedPlan: state.selectedPlan?.id === planId ? null : state.selectedPlan,
          loading: false,
        }));
        return true;
      }
      throw new Error(data.error?.message || 'Failed to delete plan');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ============================================
  // Workout Operations
  // ============================================

  /**
   * Add a workout to a plan
   */
  addWorkout: async (planId, workoutData) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/training-plans/${planId}/workouts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(workoutData),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const workout = data.data.workout;
        set((state) => {
          if (state.selectedPlan?.id === planId) {
            return {
              selectedPlan: {
                ...state.selectedPlan,
                workouts: [...(state.selectedPlan.workouts || []), workout],
              },
              loading: false,
            };
          }
          return { loading: false };
        });
        return workout;
      }
      throw new Error(data.error?.message || 'Failed to add workout');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Update a planned workout
   */
  updateWorkout: async (planId, workoutId, updates) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/training-plans/${planId}/workouts/${workoutId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const workout = data.data.workout;
        set((state) => {
          if (state.selectedPlan?.id === planId) {
            return {
              selectedPlan: {
                ...state.selectedPlan,
                workouts: state.selectedPlan.workouts.map((w) =>
                  w.id === workoutId ? workout : w
                ),
              },
              selectedWorkout: state.selectedWorkout?.id === workoutId ? workout : state.selectedWorkout,
              loading: false,
            };
          }
          return { loading: false };
        });
        return workout;
      }
      throw new Error(data.error?.message || 'Failed to update workout');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Delete a planned workout
   */
  deleteWorkout: async (planId, workoutId) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/training-plans/${planId}/workouts/${workoutId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        set((state) => {
          if (state.selectedPlan?.id === planId) {
            return {
              selectedPlan: {
                ...state.selectedPlan,
                workouts: state.selectedPlan.workouts.filter((w) => w.id !== workoutId),
              },
              selectedWorkout: state.selectedWorkout?.id === workoutId ? null : state.selectedWorkout,
              loading: false,
            };
          }
          return { loading: false };
        });
        return true;
      }
      throw new Error(data.error?.message || 'Failed to delete workout');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ============================================
  // Assignment Operations
  // ============================================

  /**
   * Assign plan to athletes
   */
  assignToAthletes: async (planId, athleteIds, dateRange = {}) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const body = { athleteIds };

      // Only include dates if dateRange is provided and has values
      if (dateRange?.startDate) {
        body.startDate = dateRange.startDate;
      }
      if (dateRange?.endDate) {
        body.endDate = dateRange.endDate;
      }

      const response = await fetch(`/api/v1/training-plans/${planId}/assign`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const assignments = data.data.assignments;
        // Refresh the plan to get updated assignments
        await get().fetchPlan(planId);
        return assignments;
      }
      throw new Error(data.error?.message || 'Failed to assign plan');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Remove an assignment
   */
  removeAssignment: async (planId, assignmentId) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/training-plans/${planId}/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        set((state) => {
          if (state.selectedPlan?.id === planId) {
            return {
              selectedPlan: {
                ...state.selectedPlan,
                assignments: state.selectedPlan.assignments.filter((a) => a.id !== assignmentId),
              },
              loading: false,
            };
          }
          return { loading: false };
        });
        return true;
      }
      throw new Error(data.error?.message || 'Failed to remove assignment');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Get plans assigned to an athlete
   */
  fetchAthletePlans: async (athleteId) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/training-plans/athlete/${athleteId}`, { headers });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        set({ athletePlans: data.data.plans || [], loading: false });
        return data.data.plans;
      }
      throw new Error(data.error?.message || 'Failed to fetch athlete plans');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ============================================
  // Compliance & Training Load
  // ============================================

  /**
   * Record a workout completion
   */
  recordCompletion: async (planId, workoutId, athleteId, data = {}) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/training-plans/${planId}/workouts/${workoutId}/complete`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ athleteId, ...data }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();

      if (responseData.success) {
        // Refresh the plan to get updated completions
        await get().fetchPlan(planId);
        return responseData.data.completion;
      }
      throw new Error(responseData.error?.message || 'Failed to record completion');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Get training load for an athlete
   */
  fetchTrainingLoad: async (athleteId, startDate, endDate) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const params = new URLSearchParams({ startDate, endDate });
      const response = await fetch(`/api/v1/training-plans/athlete/${athleteId}/load?${params}`, { headers });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        set({ trainingLoad: data.data.load, loading: false });
        return data.data.load;
      }
      throw new Error(data.error?.message || 'Failed to fetch training load');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ============================================
  // Template Operations
  // ============================================

  /**
   * Fetch available templates
   */
  fetchTemplates: async () => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch('/api/v1/training-plans/templates', { headers });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        set({ templates: data.data.templates || [], loading: false });
        return data.data.templates;
      }
      throw new Error(data.error?.message || 'Failed to fetch templates');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Create plan from template
   */
  createFromTemplate: async (templateId, customization = {}) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch('/api/v1/training-plans/from-template', {
        method: 'POST',
        headers,
        body: JSON.stringify({ templateId, ...customization }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const plan = data.data.plan;
        set((state) => ({
          plans: [plan, ...state.plans],
          selectedPlan: plan,
          loading: false,
        }));
        return plan;
      }
      throw new Error(data.error?.message || 'Failed to create plan from template');
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ============================================
  // Utility Actions
  // ============================================

  /**
   * Select a plan
   */
  selectPlan: (plan) => {
    set({ selectedPlan: plan, selectedWorkout: null });
  },

  /**
   * Select a workout
   */
  selectWorkout: (workout) => {
    set({ selectedWorkout: workout });
  },

  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set({
      plans: [],
      selectedPlan: null,
      selectedWorkout: null,
      templates: [],
      athletePlans: [],
      trainingLoad: null,
      loading: false,
      error: null,
    });
  },
}));

export default useTrainingPlanStore;
