import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { WidgetWrapper, type WidgetSize } from './WidgetWrapper';
import { HeadlineWidget } from './HeadlineWidget';
import { UnifiedActivityFeed } from './UnifiedActivityFeed';
import { useDashboardPrefs } from '../../hooks/useDashboardPrefs';
import type { WidgetId } from '../../types/dashboard';

/**
 * Widget configuration: component and default size
 */
interface WidgetConfig {
  component: React.ComponentType<{ className?: string }>;
  size: WidgetSize;
  label: string;
}

const WIDGET_CONFIGS: Record<WidgetId, WidgetConfig> = {
  headline: {
    component: HeadlineWidget,
    size: 'hero',
    label: 'Headline',
  },
  'activity-feed': {
    component: UnifiedActivityFeed,
    size: 'large',
    label: 'Activity Feed',
  },
  // Placeholder widgets - will be implemented later
  'c2-logbook': {
    component: () => (
      <div className="rounded-xl bg-card-bg p-6 h-full">
        <h3 className="text-lg font-semibold text-txt-primary mb-2">C2 Logbook</h3>
        <p className="text-txt-secondary text-sm">Concept2 integration coming soon.</p>
      </div>
    ),
    size: 'medium',
    label: 'Concept2 Logbook',
  },
  'strava-feed': {
    component: () => (
      <div className="rounded-xl bg-card-bg p-6 h-full">
        <h3 className="text-lg font-semibold text-txt-primary mb-2">Strava</h3>
        <p className="text-txt-secondary text-sm">Strava integration coming soon.</p>
      </div>
    ),
    size: 'medium',
    label: 'Strava Feed',
  },
  'quick-stats': {
    component: () => (
      <div className="rounded-xl bg-card-bg p-6 h-full">
        <h3 className="text-lg font-semibold text-txt-primary mb-2">Quick Stats</h3>
        <p className="text-txt-secondary text-sm">Stats summary coming soon.</p>
      </div>
    ),
    size: 'small',
    label: 'Quick Stats',
  },
};

/**
 * Default widget order
 */
const DEFAULT_WIDGET_ORDER: WidgetId[] = [
  'headline',
  'activity-feed',
  'c2-logbook',
  'strava-feed',
  'quick-stats',
];

/**
 * DashboardGrid - Bento grid with drag-and-drop reordering
 */
export function DashboardGrid() {
  const { preferences, setPinnedModules, isLoading: prefsLoading } = useDashboardPrefs();

  // Get widget order from preferences or use defaults
  const widgetOrder = useMemo(() => {
    if (preferences?.pinnedModules?.length) {
      // Filter to only include valid widgets
      return preferences.pinnedModules.filter(id => id in WIDGET_CONFIGS);
    }
    return DEFAULT_WIDGET_ORDER;
  }, [preferences?.pinnedModules]);

  // Local state for optimistic updates during drag
  const [localOrder, setLocalOrder] = useState<WidgetId[]>(widgetOrder);

  // Sync local state when preferences load
  useMemo(() => {
    setLocalOrder(widgetOrder);
  }, [widgetOrder]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Start drag after 8px movement
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = localOrder.indexOf(active.id as WidgetId);
        const newIndex = localOrder.indexOf(over.id as WidgetId);

        const newOrder = arrayMove(localOrder, oldIndex, newIndex);
        setLocalOrder(newOrder);
        setPinnedModules(newOrder); // Persist to server
      }
    },
    [localOrder, setPinnedModules]
  );

  if (prefsLoading) {
    return (
      <div className="grid gap-4 animate-pulse">
        <div className="h-32 bg-card-bg rounded-xl col-span-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="h-64 bg-card-bg rounded-xl md:col-span-2 md:row-span-2" />
          <div className="h-32 bg-card-bg rounded-xl" />
          <div className="h-32 bg-card-bg rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={localOrder} strategy={rectSortingStrategy}>
        {/* Hero section (headline) - outside main grid */}
        {localOrder.includes('headline') && (
          <div className="mb-6">
            <HeadlineWidget />
          </div>
        )}

        {/* Bento grid for other widgets */}
        <div
          className="
            grid gap-4
            grid-cols-1 md:grid-cols-2 lg:grid-cols-3
            auto-rows-[minmax(150px,auto)]
          "
          style={{ gridAutoFlow: 'dense' }}
        >
          {localOrder
            .filter(id => id !== 'headline') // Headline is separate
            .map(widgetId => {
              const config = WIDGET_CONFIGS[widgetId];
              if (!config) return null;

              const WidgetComponent = config.component;

              return (
                <WidgetWrapper
                  key={widgetId}
                  id={widgetId}
                  size={config.size}
                  isDraggingEnabled={true}
                >
                  <WidgetComponent className="h-full" />
                </WidgetWrapper>
              );
            })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
