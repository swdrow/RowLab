/**
 * Dashboard Grid Component
 * Phase 27-05: Complete rewrite using widget registry, catalog, and edit mode
 */

import { useState, useRef, useEffect } from 'react';
import { Responsive as ResponsiveGridLayout, Layout as RGLLayout } from 'react-grid-layout';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowCounterClockwise, DotsSixVertical, X } from '@phosphor-icons/react';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import { getWidgetConfig } from '../config/widgetRegistry';
import { WidgetCatalog } from './WidgetCatalog';
import { WidgetSizeSelector } from './WidgetSizeSelector';
import { SPRING_CONFIG } from '../../../utils/animations';
import type { WidgetInstance, UserRole, WidgetSize } from '../types';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface DashboardGridProps {
  role: 'coach' | 'athlete';
  children?: React.ReactNode; // optional header content (exception banner, etc.)
}

/**
 * DashboardGrid - Enhanced grid with catalog, sizing, and edit mode
 *
 * Features:
 * - react-grid-layout Responsive with proper breakpoints
 * - Widget catalog modal for adding/removing widgets
 * - Size preset selector per widget
 * - Edit mode with iOS-style jiggle animation
 * - localStorage + debounced DB sync via useDashboardLayout
 */
export function DashboardGrid({ role, children }: DashboardGridProps) {
  const {
    layout,
    isEditing,
    setIsEditing,
    updateLayout,
    addWidget,
    removeWidget,
    changeWidgetSize,
    resetLayout,
  } = useDashboardLayout(role);

  const [catalogOpen, setCatalogOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);

  // Wait for mount and measure container width
  useEffect(() => {
    setMounted(true);

    const measureWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    measureWidth();
    window.addEventListener('resize', measureWidth);
    return () => window.removeEventListener('resize', measureWidth);
  }, []);

  // Scale widget position from one column count to another so widgets don't overflow
  const scalePosition = (pos: { x: number; w: number }, fromCols: number, toCols: number) => ({
    x: Math.min(
      Math.floor((pos.x / fromCols) * toCols),
      Math.max(0, toCols - Math.min(pos.w, toCols))
    ),
    w: Math.min(pos.w, toCols),
  });

  // Convert layout to react-grid-layout format with scaled positions per breakpoint
  const gridLayouts = {
    lg: layout.widgets.map((w) => ({
      i: w.id,
      x: w.position.x,
      y: w.position.y,
      w: w.position.w,
      h: w.position.h,
      minW: 2,
      minH: 2,
    })),
    md: layout.widgets.map((w) => {
      const scaled = scalePosition(w.position, 12, 10);
      return {
        i: w.id,
        x: scaled.x,
        y: w.position.y,
        w: scaled.w,
        h: w.position.h,
        minW: 2,
        minH: 2,
      };
    }),
    sm: layout.widgets.map((w) => {
      const scaled = scalePosition(w.position, 12, 6);
      return {
        i: w.id,
        x: scaled.x,
        y: w.position.y,
        w: scaled.w,
        h: w.position.h,
        minW: 2,
        minH: 2,
      };
    }),
  };

  // Handle layout change from drag
  const handleLayoutChange = (newLayout: RGLLayout[], layouts: any) => {
    if (!isEditing) return;

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

  // Get active widget types for catalog
  const activeWidgetTypes = layout.widgets.map((w) => w.widgetType);

  // Handle catalog add
  const handleAddWidget = (widgetType: string) => {
    addWidget(widgetType);
    setCatalogOpen(false);
  };

  // Handle catalog remove
  const handleRemoveWidget = (widgetType: string) => {
    const widget = layout.widgets.find((w) => w.widgetType === widgetType);
    if (widget) {
      removeWidget(widget.id);
    }
  };

  if (!mounted) {
    return <div ref={containerRef} className="min-h-screen" />;
  }

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Header content (exception banner, etc.) */}
      {children}

      {/* Edit mode toolbar */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={SPRING_CONFIG}
            className="flex items-center gap-3 p-4 bg-ink-raised border border-white/[0.06]"
          >
            <button
              onClick={() => setCatalogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent-copper text-white rounded-lg hover:bg-accent-copper/90 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Widget
            </button>

            <button
              onClick={resetLayout}
              className="flex items-center gap-2 px-4 py-2 border border-white/[0.06] text-ink-secondary hover:text-ink-bright hover:border-white/[0.12] rounded-lg transition-colors"
            >
              <ArrowCounterClockwise className="w-4 h-4" />
              Reset Layout
            </button>

            <div className="flex-1" />

            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-accent-copper text-white rounded-lg hover:bg-accent-copper/90 transition-colors font-medium"
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle edit mode when not editing */}
      {!isEditing && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 border border-white/[0.06] text-ink-secondary hover:text-ink-bright hover:border-white/[0.12] transition-colors text-sm"
          >
            Edit Layout
          </button>
        </div>
      )}

      {/* Grid */}
      <ResponsiveGridLayout
        className="dashboard-grid"
        layouts={gridLayouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 10, sm: 6 }}
        rowHeight={60}
        width={containerWidth}
        margin={[16, 16]}
        isDraggable={isEditing}
        isResizable={false} // Size via presets only
        draggableHandle=".widget-drag-handle"
        onLayoutChange={handleLayoutChange}
      >
        {layout.widgets.map((widget) => (
          <div key={widget.id} className={isEditing ? 'widget-editing' : ''}>
            <WidgetCard
              widget={widget}
              role={role}
              isEditing={isEditing}
              onSizeChange={(newSize) => changeWidgetSize(widget.id, newSize)}
              onRemove={() => removeWidget(widget.id)}
            />
          </div>
        ))}
      </ResponsiveGridLayout>

      {/* Edit mode instruction */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-ink-raised border border-white/[0.06] shadow-xl"
          >
            <p className="text-sm text-ink-secondary">
              <strong className="text-ink-bright">Drag</strong> widgets to rearrange.{' '}
              <strong className="text-ink-bright">Click size</strong> to resize.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget Catalog Modal */}
      <WidgetCatalog
        isOpen={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        role={role}
        activeWidgets={activeWidgetTypes}
        onAddWidget={handleAddWidget}
        onRemoveWidget={handleRemoveWidget}
      />
    </div>
  );
}

// ============================================
// WIDGET CARD WRAPPER
// ============================================

interface WidgetCardProps {
  widget: WidgetInstance;
  role: UserRole;
  isEditing: boolean;
  onSizeChange: (newSize: WidgetSize) => void;
  onRemove: () => void;
}

function WidgetCard({ widget, role, isEditing, onSizeChange, onRemove }: WidgetCardProps) {
  const config = getWidgetConfig(widget.widgetType);

  if (!config) {
    return (
      <div className="h-full bg-ink-raised border border-white/[0.06] rounded-xl p-4 flex items-center justify-center">
        <p className="text-sm text-ink-secondary">Widget not found: {widget.widgetType}</p>
      </div>
    );
  }

  const WidgetComponent = config.component;

  return (
    <div className="h-full bg-ink-raised border border-white/[0.06] overflow-hidden transition-all hover:border-white/[0.12]">
      {/* Edit mode header */}
      {isEditing && (
        <div className="flex items-center justify-between px-3 py-2 bg-ink-base border-b border-white/[0.06]">
          {/* Drag handle */}
          <div className="flex items-center gap-2">
            <div className="widget-drag-handle cursor-grab active:cursor-grabbing">
              <DotsSixVertical className="w-5 h-5 text-ink-tertiary" />
            </div>
            <span className="text-sm font-medium text-ink-bright">{config.title}</span>
          </div>

          {/* Size selector + Remove button */}
          <div className="flex items-center gap-2">
            <WidgetSizeSelector
              widgetType={widget.widgetType}
              currentSize={widget.size}
              onSizeChange={onSizeChange}
            />

            <button
              onClick={onRemove}
              className="p-1 text-status-error hover:bg-status-error/10 rounded transition-colors"
              title="Remove widget"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Widget content */}
      <div className={`${isEditing ? 'h-[calc(100%-48px)]' : 'h-full'} overflow-auto`}>
        <WidgetComponent widgetId={widget.id} size={widget.size} isEditing={isEditing} />
      </div>
    </div>
  );
}

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

if (typeof document !== 'undefined' && !document.getElementById('dashboard-grid-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'dashboard-grid-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
