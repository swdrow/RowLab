import { create } from 'zustand';

// @deprecated This store is deprecated. Use TanStack Query hooks from src/v2/hooks/ instead.
// V1 legacy code still uses this store during migration.
import { persist } from 'zustand/middleware';

// @deprecated This store is deprecated. Use TanStack Query hooks from src/v2/hooks/ instead.
// V1 legacy code still uses this store during migration.

/**
 * App-wide settings store
 * Manages feature toggles and configuration for resource management
 *
 * Features can be toggled by admins to reduce server/client load
 */
const useSettingsStore = create(
  persist(
    (set, get) => ({
      // UI State
      sidebarCollapsed: false,
      commandPaletteOpen: false,

      // AI Assistant settings
      aiEnabled: false,
      aiModel: 'phi3:mini',
      aiEndpoint: 'http://localhost:11434',

      // Feature toggles - Resource-heavy features can be disabled
      features: {
        // Core features (low overhead)
        boatView: true,
        ergData: true,
        analytics: true,

        // AI features (high overhead - requires Ollama running)
        aiAssistant: false,
        aiSuggestions: false, // Auto-lineup suggestions

        // Real-time features (moderate overhead - WebSocket connections)
        collaboration: false, // Real-time collaboration
        presenceTracking: false, // Show who's online
        liveCursors: false, // Show other users' cursors

        // 3D features (high client overhead)
        threeDViewer: true,
        threeDAnimations: true,
        waterSimulation: false, // Animated water in 3D view

        // PDF/Export features (high memory on generation)
        pdfExport: true,
        highResPDF: false, // Higher quality but more memory
      },

      // Performance settings
      performance: {
        reducedMotion: false, // Disable animations
        lowPowerMode: false, // Reduce all resource usage
        maxActiveBoats: 10, // Limit concurrent boats
        cursorUpdateRate: 50, // ms between cursor updates
      },

      // Actions
      // UI Actions
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      toggleCommandPalette: () => set({ commandPaletteOpen: !get().commandPaletteOpen }),

      // AI Actions
      toggleAI: () => {
        const newValue = !get().aiEnabled;
        set({ aiEnabled: newValue });
        return newValue;
      },

      setAIEnabled: (enabled) => set({ aiEnabled: enabled }),

      setAIModel: (model) => set({ aiModel: model }),

      setAIEndpoint: (endpoint) => set({ aiEndpoint: endpoint }),

      toggleFeature: (feature) => {
        const features = get().features;
        set({
          features: {
            ...features,
            [feature]: !features[feature]
          }
        });
      },

      setFeature: (feature, enabled) => {
        const features = get().features;
        set({
          features: {
            ...features,
            [feature]: enabled
          }
        });
      },

      // Bulk feature control
      setFeatures: (updates) => {
        const features = get().features;
        set({
          features: {
            ...features,
            ...updates
          }
        });
      },

      // Enable low power mode - disables all heavy features
      enableLowPowerMode: () => {
        set({
          performance: {
            ...get().performance,
            lowPowerMode: true,
            reducedMotion: true,
          },
          features: {
            ...get().features,
            aiAssistant: false,
            aiSuggestions: false,
            collaboration: false,
            presenceTracking: false,
            liveCursors: false,
            waterSimulation: false,
            highResPDF: false,
          }
        });
      },

      // Disable low power mode - restore defaults
      disableLowPowerMode: () => {
        set({
          performance: {
            ...get().performance,
            lowPowerMode: false,
            reducedMotion: false,
          },
        });
      },

      // Performance settings
      setPerformance: (key, value) => {
        set({
          performance: {
            ...get().performance,
            [key]: value
          }
        });
      },

      // Check if Ollama is running
      checkOllamaStatus: async () => {
        try {
          const endpoint = get().aiEndpoint;
          const res = await fetch(`${endpoint}/api/tags`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000),
          });
          return res.ok;
        } catch (err) {
          return false;
        }
      },

      // Get available models from Ollama
      getAvailableModels: async () => {
        try {
          const endpoint = get().aiEndpoint;
          const res = await fetch(`${endpoint}/api/tags`);
          if (!res.ok) return [];
          const data = await res.json();
          return data.models || [];
        } catch (err) {
          return [];
        }
      },

      // Check if a feature is enabled (convenience method)
      isFeatureEnabled: (feature) => {
        const { features, performance } = get();

        // Low power mode overrides certain features
        if (performance.lowPowerMode) {
          const heavyFeatures = [
            'aiAssistant', 'aiSuggestions', 'collaboration',
            'presenceTracking', 'liveCursors', 'waterSimulation', 'highResPDF'
          ];
          if (heavyFeatures.includes(feature)) {
            return false;
          }
        }

        return features[feature] ?? false;
      },
    }),
    {
      name: 'rowlab-settings',
    }
  )
);

export default useSettingsStore;
