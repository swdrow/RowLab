/**
 * Coach Dashboard Layout
 * Phase 27-03: Complete coach dashboard with bento grid, exception banner, and widgets
 */

import React, { useMemo } from 'react';
import { ResponsiveGridLayout, useContainerWidth, Layout as RGLLayout } from 'react-grid-layout';
import { DotsSixVertical, X } from '@phosphor-icons/react';
import { useAuth } from '../../../contexts/AuthContext';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import { useExceptions } from '../hooks/useExceptions';
import { useTour } from '../hooks/useTour';
import { getWidgetConfig } from '../config/widgetRegistry';
import { ExceptionBanner, ExceptionBadge } from './ExceptionBanner';
import { EmptyStateAnimated } from '../empty-states/EmptyStateAnimated';
import { TourLauncher } from './TourLauncher';
import type { WidgetInstance } from '../types';

// Import CSS for react-grid-layout
import 'react-grid-layout/css/styles.css';

/**
 * CoachDashboard - Complete coach dashboard layout
 *
 * Features:
 * - Exception banner at top (auto-hides when no issues)
 * - Bento grid with react-grid-layout Responsive
 * - Edit mode with iOS-style jiggle animation
 * - Quick actions integrated in hero card (TodaysPracticeSummary)
 * - Per-widget exception badges
 *
 * Per CONTEXT.md: "Edit mode should feel like iOS home screen — widgets jiggle"
 */
export const CoachDashboard: React.FC = () => {
  const { activeTeamId, isAuthenticated, isInitialized } = useAuth();
  const { layout, isEditing, setIsEditing, updateLayout, changeWidgetSize, removeWidget } =
    useDashboardLayout('coach');

  const { summary: exceptionSummary, widgetExceptions } = useExceptions(activeTeamId || '');

  // Container width measurement using react-grid-layout v2 hook
  // Must check `mounted` before rendering grid — width is 0 until ResizeObserver fires
  const { containerRef, width: containerWidth, mounted } = useContainerWidth();

  // Auto-launch tour on first visit
  useTour('coach-dashboard', { autoStart: true, delay: 800 });

  // Scale widget position from one column count to another so widgets don't overflow
  const scalePosition = (pos: { x: number; w: number }, fromCols: number, toCols: number) => ({
    x: Math.min(
      Math.floor((pos.x / fromCols) * toCols),
      Math.max(0, toCols - Math.min(pos.w, toCols))
    ),
    w: Math.min(pos.w, toCols),
  });

  // Convert layout to react-grid-layout format with scaled positions per breakpoint
  const gridLayouts = useMemo((): { lg: RGLLayout[]; md: RGLLayout[]; sm: RGLLayout[] } => {
    const lg = layout.widgets.map((widget) => ({
      i: widget.id,
      x: widget.position.x,
      y: widget.position.y,
      w: widget.position.w,
      h: widget.position.h,
      minW: 2,
      minH: 2,
      maxW: 12,
      maxH: 8,
    }));

    const md = layout.widgets.map((widget) => {
      const scaled = scalePosition(widget.position, 12, 10);
      return {
        i: widget.id,
        x: scaled.x,
        y: widget.position.y,
        w: scaled.w,
        h: widget.position.h,
        minW: 2,
        minH: 2,
        maxW: 10,
        maxH: 8,
      };
    });

    const sm = layout.widgets.map((widget) => {
      const scaled = scalePosition(widget.position, 12, 6);
      return {
        i: widget.id,
        x: scaled.x,
        y: widget.position.y,
        w: scaled.w,
        h: widget.position.h,
        minW: 2,
        minH: 2,
        maxW: 6,
        maxH: 8,
      };
    });

    return { lg, md, sm };
  }, [layout.widgets]);

  // Handle layout change from drag/drop
  const handleLayoutChange = (newLayout: RGLLayout[]) => {
    if (!isEditing) return;
    // Don't save layout when container width hasn't been measured yet
    if (!containerWidth || containerWidth < 100) return;

    // Update widget positions
    const updatedWidgets = layout.widgets.map((widget) => {
      const gridItem = newLayout.find((item) => item.i === widget.id);
      if (!gridItem) return widget;

      return {
        ...widget,
        position: {
          x: gridItem.x,
          y: gridItem.y,
          w: gridItem.w,
          h: gridItem.h,
        },
      };
    });

    updateLayout({
      ...layout,
      widgets: updatedWidgets,
    });
  };

  // Loading state
  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--color-interactive-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!activeTeamId) {
    return (
      <div className="p-6">
        <EmptyStateAnimated
          title="No Active Team"
          description="Please select or create a team to view your dashboard."
          action={{
            label: 'Go to Teams',
            to: '/app/settings/teams',
          }}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-[var(--color-bg-base)] p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Dashboard</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Your team overview and quick actions
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <TourLauncher tourId="coach-dashboard" variant="button" />

          {/* Edit Layout Toggle */}
          <button
            data-tour="edit-layout"
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive-primary)] ${
              isEditing
                ? 'bg-[var(--color-interactive-primary)] text-white hover:bg-[var(--color-interactive-hover)]'
                : 'border border-ink-border text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-elevated)]'
            }`}
          >
            {isEditing ? 'Done' : 'Edit Layout'}
          </button>
        </div>
      </div>

      {/* Exception Banner */}
      <div data-tour="exception-banner">
        <ExceptionBanner summary={exceptionSummary} />
      </div>

      {/* Bento Grid — only render when container width is measured */}
      {mounted ? (
        <ResponsiveGridLayout
          className="dashboard-grid"
          layouts={gridLayouts}
          breakpoints={{ lg: 900, md: 600, sm: 0 }}
          cols={{ lg: 12, md: 10, sm: 6 }}
          rowHeight={60}
          width={containerWidth}
          margin={[16, 16]}
          isDraggable={isEditing}
          isResizable={false} // Use size presets only
          draggableHandle=".widget-drag-handle"
          onLayoutChange={handleLayoutChange}
        >
          {layout.widgets.map((widget) => (
            <div
              key={widget.id}
              className={`widget-container ${isEditing ? 'widget-editing' : ''}`}
            >
              <WidgetCard
                widget={widget}
                isEditing={isEditing}
                exceptions={widgetExceptions[widget.id] || []}
                onSizeChange={(newSize) => changeWidgetSize(widget.id, newSize)}
                onRemove={() => removeWidget(widget.id)}
              />
            </div>
          ))}
        </ResponsiveGridLayout>
      ) : (
        <div className="grid grid-cols-12 gap-4">
          {[6, 3, 3, 4, 4, 4].map((span, i) => (
            <div
              key={i}
              className={`col-span-${span} h-48 rounded-xl bg-[var(--color-bg-surface-elevated)] border border-ink-border animate-pulse`}
            />
          ))}
        </div>
      )}

      {/* Edit Mode Instructions */}
      {isEditing && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-[var(--color-bg-surface-elevated)] border border-ink-border rounded-lg shadow-lg">
          <p className="text-sm text-[var(--color-text-secondary)]">
            <strong className="text-[var(--color-text-primary)]">Drag</strong> widgets to rearrange.{' '}
            <strong className="text-[var(--color-text-primary)]">Click size</strong> to resize.
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================
// WIDGET CARD WRAPPER
// ============================================

interface WidgetCardProps {
  widget: WidgetInstance;
  isEditing: boolean;
  exceptions: any[];
  onSizeChange: (newSize: 'compact' | 'normal' | 'expanded') => void;
  onRemove: () => void;
}

/**
 * WidgetCard - Wrapper for individual dashboard widgets
 *
 * Handles:
 * - Widget component rendering
 * - Edit mode UI (drag handle, size selector, remove button)
 * - Exception badge overlay
 * - Glass card styling
 */
const WidgetCard: React.FC<WidgetCardProps> = ({
  widget,
  isEditing,
  exceptions,
  onSizeChange,
  onRemove,
}) => {
  const config = getWidgetConfig(widget.widgetType);

  if (!config) {
    return (
      <div className="h-full glass-card p-4 flex items-center justify-center">
        <p className="text-sm text-[var(--color-text-secondary)]">Widget not found</p>
      </div>
    );
  }

  const WidgetComponent = config.component;

  // Determine exception severity
  const criticalCount = exceptions.filter((e) => e.severity === 'critical').length;
  const warningCount = exceptions.filter((e) => e.severity === 'warning').length;
  const exceptionSeverity = criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'ok';
  const exceptionCount = criticalCount + warningCount;

  // Available sizes for this widget
  const availableSizes = Object.keys(config.sizes) as ('compact' | 'normal' | 'expanded')[];

  // Map widget types to tour targets
  const getTourAttribute = () => {
    if (widget.widgetType === 'todays-practice') return 'todays-practice';
    if (config.category === 'metrics') return 'metric-cards';
    return undefined;
  };

  return (
    <div
      data-tour={getTourAttribute()}
      className="h-full relative glass-card bg-[var(--color-bg-surface-elevated)] border border-ink-border rounded-xl overflow-hidden transition-all hover:border-accent-copper/30"
    >
      {/* Edit Mode Header */}
      {isEditing && (
        <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-bg-base)] border-b border-ink-border">
          {/* Drag Handle */}
          <div className="flex items-center gap-2">
            <div className="widget-drag-handle cursor-grab active:cursor-grabbing">
              <DotsSixVertical className="w-5 h-5 text-[var(--color-text-tertiary)]" />
            </div>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {config.title}
            </span>
          </div>

          {/* Size Selector */}
          <div className="flex items-center gap-1">
            {availableSizes.map((size) => (
              <button
                key={size}
                onClick={() => onSizeChange(size)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  widget.size === size
                    ? 'bg-[var(--color-interactive-primary)] text-white'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-elevated)]'
                }`}
              >
                {size[0].toUpperCase()}
              </button>
            ))}

            {/* Remove Button */}
            <button
              onClick={onRemove}
              className="ml-2 p-1 text-[var(--color-status-error)] hover:bg-status-error/10 rounded transition-colors"
              title="Remove widget"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Widget Content */}
      <div className={`${isEditing ? 'h-[calc(100%-48px)]' : 'h-full'} overflow-auto`}>
        <WidgetComponent widgetId={widget.id} size={widget.size} isEditing={isEditing} />
      </div>

      {/* Exception Badge Overlay */}
      {!isEditing && exceptionCount > 0 && (
        <ExceptionBadge severity={exceptionSeverity} count={exceptionCount} />
      )}
    </div>
  );
};

// ============================================
// CSS ANIMATIONS
// ============================================

// Inject jiggle animation for edit mode
const styles = `
@keyframes widget-jiggle {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(0.5deg);
  }
  75% {
    transform: rotate(-0.5deg);
  }
}

.widget-editing {
  animation: widget-jiggle 0.3s ease-in-out infinite;
}

.widget-editing:hover {
  animation: none;
}
`;

if (typeof document !== 'undefined' && !document.getElementById('dashboard-widget-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'dashboard-widget-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
