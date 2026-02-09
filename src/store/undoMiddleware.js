/**
 * Undo/Redo Middleware for Zustand
 *
 * Provides temporal state management with:
 * - History tracking for specified state keys
 * - Undo/redo with keyboard shortcuts support
 * - Checkpointing for complex operations
 * - History size limits to prevent memory issues
 */

/**
 * Creates an undo/redo middleware for Zustand stores
 *
 * @param {Object} config - Configuration options
 * @param {string[]} config.trackedKeys - State keys to track in history
 * @param {number} config.historyLimit - Maximum history entries (default: 50)
 * @returns {Function} Zustand middleware function
 */
export const undoMiddleware = (config) => (initializer) => (set, get, api) => {
  const { trackedKeys = [], historyLimit = 50 } = config;

  // History state (not persisted)
  let past = [];
  let future = [];
  let isUndoRedo = false;
  let batchedChanges = null;

  /**
   * Get a snapshot of tracked state
   */
  const getSnapshot = () => {
    const state = get();
    const snapshot = {};
    for (const key of trackedKeys) {
      // Deep clone to prevent reference issues
      snapshot[key] = JSON.parse(JSON.stringify(state[key]));
    }
    return snapshot;
  };

  /**
   * Check if two snapshots are equal
   */
  const snapshotsEqual = (a, b) => {
    return JSON.stringify(a) === JSON.stringify(b);
  };

  /**
   * Enhanced set function that tracks history
   */
  const trackedSet = (partial, replace) => {
    if (isUndoRedo) {
      // Skip history tracking during undo/redo
      set(partial, replace);
      return;
    }

    if (batchedChanges !== null) {
      // Accumulate changes for batch
      if (typeof partial === 'function') {
        batchedChanges = { ...batchedChanges, ...partial(get()) };
      } else {
        batchedChanges = { ...batchedChanges, ...partial };
      }
      return;
    }

    // Get current snapshot before change
    const currentSnapshot = getSnapshot();

    // Apply the change
    set(partial, replace);

    // Get new snapshot after change
    const newSnapshot = getSnapshot();

    // Only add to history if tracked state actually changed
    if (!snapshotsEqual(currentSnapshot, newSnapshot)) {
      past = [...past.slice(-historyLimit + 1), currentSnapshot];
      future = []; // Clear redo stack on new change
    }
  };

  // Initialize the store with enhanced functionality
  const initialState = initializer(trackedSet, get, api);

  return {
    ...initialState,

    // Undo/Redo state
    _history: {
      get canUndo() {
        return past.length > 0;
      },
      get canRedo() {
        return future.length > 0;
      },
      get undoCount() {
        return past.length;
      },
      get redoCount() {
        return future.length;
      },
    },

    /**
     * Undo the last change
     */
    undo: () => {
      if (past.length === 0) return false;

      isUndoRedo = true;
      try {
        const currentSnapshot = getSnapshot();
        const previousSnapshot = past[past.length - 1];

        past = past.slice(0, -1);
        future = [currentSnapshot, ...future];

        set(previousSnapshot);
        return true;
      } finally {
        isUndoRedo = false;
      }
    },

    /**
     * Redo the last undone change
     */
    redo: () => {
      if (future.length === 0) return false;

      isUndoRedo = true;
      try {
        const currentSnapshot = getSnapshot();
        const nextSnapshot = future[0];

        future = future.slice(1);
        past = [...past, currentSnapshot];

        set(nextSnapshot);
        return true;
      } finally {
        isUndoRedo = false;
      }
    },

    /**
     * Start a batch of changes (will be recorded as single undo step)
     */
    startBatch: () => {
      if (batchedChanges === null) {
        batchedChanges = {};
      }
    },

    /**
     * End a batch and commit all changes as one history entry
     */
    endBatch: () => {
      if (batchedChanges === null) return;

      const changes = batchedChanges;
      batchedChanges = null;

      if (Object.keys(changes).length > 0) {
        const currentSnapshot = getSnapshot();
        set(changes);
        const newSnapshot = getSnapshot();

        if (!snapshotsEqual(currentSnapshot, newSnapshot)) {
          past = [...past.slice(-historyLimit + 1), currentSnapshot];
          future = [];
        }
      }
    },

    /**
     * Create a checkpoint (save current state to history without making changes)
     */
    checkpoint: () => {
      const snapshot = getSnapshot();
      if (past.length === 0 || !snapshotsEqual(past[past.length - 1], snapshot)) {
        past = [...past.slice(-historyLimit + 1), snapshot];
      }
    },

    /**
     * Clear all history
     */
    clearHistory: () => {
      past = [];
      future = [];
    },

    /**
     * Get history info for debugging
     */
    getHistoryInfo: () => ({
      pastCount: past.length,
      futureCount: future.length,
      historyLimit,
      trackedKeys,
    }),
  };
};

export default undoMiddleware;
