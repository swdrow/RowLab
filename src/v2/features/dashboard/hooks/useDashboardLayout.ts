/**
 * Dashboard Layout Hook
 * Phase 27-01: Manages dashboard widget layout with localStorage + debounced DB sync
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import api from '../../../utils/api';
import { useAuth } from '../../../contexts/AuthContext';
import type { DashboardLayout, WidgetInstance, WidgetSize } from '../types';
import { getDefaultLayout, getWidgetConfig } from '../config/widgetRegistry';

const STORAGE_KEY = 'rowlab_dashboard_layout';

interface UseDashboardLayoutReturn {
  layout: DashboardLayout;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  updateLayout: (newLayout: DashboardLayout) => void;
  addWidget: (widgetType: string, size?: WidgetSize) => void;
  removeWidget: (instanceId: string) => void;
  changeWidgetSize: (instanceId: string, newSize: WidgetSize) => void;
  resetLayout: () => void;
}

/**
 * Save layout to database
 */
async function saveLayoutToDb(userId: string, layout: DashboardLayout): Promise<void> {
  await api.put(`/api/v1/dashboard-preferences`, {
    userId,
    layout,
  });
}

/**
 * Dashboard layout hook with localStorage + debounced DB sync
 */
export function useDashboardLayout(role: 'coach' | 'athlete'): UseDashboardLayoutReturn {
  const { user } = useAuth();
  const storageKey = `${STORAGE_KEY}_${user?.id || 'anon'}_${role}`;
  const [layout, setLayout] = useState<DashboardLayout>(() => {
    // Read from localStorage on mount for instant load
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as DashboardLayout;
        // Validate layout isn't corrupted (e.g. all widgets stacked at x=0 from width=0 render)
        if (parsed.widgets?.length > 1) {
          const allSameX = parsed.widgets.every((w) => w.position.x === 0);
          if (allSameX) {
            console.warn('Detected corrupt staircase layout in localStorage, resetting to default');
            localStorage.removeItem(storageKey);
            return getDefaultLayout(role);
          }
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse stored layout:', e);
      }
    }
    // Fallback to default layout
    return getDefaultLayout(role);
  });

  const [isEditing, setIsEditing] = useState(false);

  // Mutation for DB sync
  const { mutate: syncToDb } = useMutation({
    mutationFn: (newLayout: DashboardLayout) => {
      if (!user?.id) {
        return Promise.reject(new Error('User not authenticated'));
      }
      return saveLayoutToDb(user.id, newLayout);
    },
    onError: (error) => {
      console.error('Failed to sync layout to database:', error);
    },
  });

  // Debounced DB sync (4 seconds)
  const debouncedSync = useMemo(
    () =>
      debounce((newLayout: DashboardLayout) => {
        syncToDb(newLayout);
      }, 4000),
    [syncToDb]
  );

  // Update layout with immediate localStorage save + debounced DB sync
  const updateLayout = useCallback(
    (newLayout: DashboardLayout) => {
      setLayout(newLayout);
      // Save to localStorage immediately
      localStorage.setItem(storageKey, JSON.stringify(newLayout));
      // Debounced DB sync for cross-device
      debouncedSync(newLayout);
    },
    [storageKey, debouncedSync]
  );

  // Add widget to layout
  const addWidget = useCallback(
    (widgetType: string, size?: WidgetSize) => {
      const config = getWidgetConfig(widgetType);
      if (!config) {
        console.error(`Widget config not found: ${widgetType}`);
        return;
      }

      const selectedSize = size || config.defaultSize;
      const sizeConfig = config.sizes[selectedSize];
      if (!sizeConfig) {
        console.error(`Size config not found: ${selectedSize}`);
        return;
      }

      // Find next available position (simple auto-placement)
      // Start from bottom of existing widgets
      const maxY =
        layout.widgets.length > 0
          ? Math.max(...layout.widgets.map((w) => w.position.y + w.position.h))
          : 0;

      const newWidget: WidgetInstance = {
        id: `widget-${Date.now()}`,
        widgetType,
        size: selectedSize,
        position: {
          x: 0,
          y: maxY,
          w: sizeConfig.w,
          h: sizeConfig.h,
        },
      };

      updateLayout({
        ...layout,
        widgets: [...layout.widgets, newWidget],
        version: layout.version + 1,
      });
    },
    [layout, updateLayout]
  );

  // Remove widget from layout
  const removeWidget = useCallback(
    (instanceId: string) => {
      updateLayout({
        ...layout,
        widgets: layout.widgets.filter((w) => w.id !== instanceId),
        version: layout.version + 1,
      });
    },
    [layout, updateLayout]
  );

  // Change widget size
  const changeWidgetSize = useCallback(
    (instanceId: string, newSize: WidgetSize) => {
      const widget = layout.widgets.find((w) => w.id === instanceId);
      if (!widget) {
        console.error(`Widget not found: ${instanceId}`);
        return;
      }

      const config = getWidgetConfig(widget.widgetType);
      if (!config) {
        console.error(`Widget config not found: ${widget.widgetType}`);
        return;
      }

      const sizeConfig = config.sizes[newSize];
      if (!sizeConfig) {
        console.error(`Size config not found: ${newSize}`);
        return;
      }

      updateLayout({
        ...layout,
        widgets: layout.widgets.map((w) =>
          w.id === instanceId
            ? {
                ...w,
                size: newSize,
                position: {
                  ...w.position,
                  w: sizeConfig.w,
                  h: sizeConfig.h,
                },
              }
            : w
        ),
        version: layout.version + 1,
      });
    },
    [layout, updateLayout]
  );

  // Reset to default layout
  const resetLayout = useCallback(() => {
    const defaultLayout = getDefaultLayout(role);
    updateLayout(defaultLayout);
  }, [role, updateLayout]);

  return {
    layout,
    isEditing,
    setIsEditing,
    updateLayout,
    addWidget,
    removeWidget,
    changeWidgetSize,
    resetLayout,
  };
}
