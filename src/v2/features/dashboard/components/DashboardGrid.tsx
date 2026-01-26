import { useState, useCallback } from 'react';
import ReactGridLayout from 'react-grid-layout';
import { DotsSixVertical, Gear, ArrowsOut } from '@phosphor-icons/react';
import { UpcomingSessionsWidget } from './widgets/UpcomingSessionsWidget';
import { RecentActivityWidget } from './widgets/RecentActivityWidget';
import { AttendanceSummaryWidget } from './widgets/AttendanceSummaryWidget';
import { HostVisitsWidget } from './widgets/HostVisitsWidget';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

type Layout = ReactGridLayout.Layout;

// Widget definitions
const WIDGETS = {
  upcomingSessions: {
    title: 'Upcoming Sessions',
    component: UpcomingSessionsWidget,
    defaultSize: { w: 6, h: 4 },
  },
  recentActivity: {
    title: 'Recent Activity',
    component: RecentActivityWidget,
    defaultSize: { w: 6, h: 6 },
  },
  attendanceSummary: {
    title: "Today's Attendance",
    component: AttendanceSummaryWidget,
    defaultSize: { w: 4, h: 4 },
  },
  hostVisits: {
    title: 'Host Visits',
    component: HostVisitsWidget,
    defaultSize: { w: 6, h: 4 },
  },
};

type WidgetId = keyof typeof WIDGETS;

// Default layout
const DEFAULT_LAYOUT: Layout[] = [
  { i: 'upcomingSessions', x: 0, y: 0, w: 6, h: 4 },
  { i: 'attendanceSummary', x: 6, y: 0, w: 4, h: 4 },
  { i: 'hostVisits', x: 0, y: 4, w: 6, h: 4 },
  { i: 'recentActivity', x: 0, y: 8, w: 10, h: 6 },
];

// Local storage key
const LAYOUT_STORAGE_KEY = 'rowlab_dashboard_layout';

function loadLayout(): Layout[] {
  try {
    const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_LAYOUT;
  } catch {
    return DEFAULT_LAYOUT;
  }
}

function saveLayout(layout: Layout[]): void {
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // Ignore storage errors
  }
}

interface DashboardGridProps {
  editable?: boolean;
}

export function DashboardGrid({ editable = false }: DashboardGridProps) {
  const [layout, setLayout] = useState<Layout[]>(loadLayout);
  const [isEditing, setIsEditing] = useState(editable);

  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    setLayout(newLayout);
    saveLayout(newLayout);
  }, []);

  const handleResetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
    saveLayout(DEFAULT_LAYOUT);
  }, []);

  return (
    <div className="relative">
      {/* Edit controls */}
      <div className="flex items-center justify-end gap-2 mb-4">
        {isEditing && (
          <button
            onClick={handleResetLayout}
            className="px-3 py-1.5 rounded-lg border border-bdr-default text-txt-secondary
              hover:text-txt-primary hover:border-bdr-focus transition-colors text-sm"
          >
            Reset Layout
          </button>
        )}
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors text-sm ${
            isEditing
              ? 'bg-accent-primary/10 border-accent-primary/20 text-accent-primary'
              : 'border-bdr-default text-txt-secondary hover:text-txt-primary'
          }`}
        >
          {isEditing ? (
            <>
              <Gear className="w-4 h-4" />
              Done Editing
            </>
          ) : (
            <>
              <ArrowsOut className="w-4 h-4" />
              Edit Layout
            </>
          )}
        </button>
      </div>

      {/* Grid */}
      <ReactGridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={60}
        width={1200}
        margin={[16, 16]}
        onLayoutChange={handleLayoutChange as any}
        isDraggable={isEditing}
        isResizable={isEditing}
        draggableHandle=".drag-handle"
      >
        {layout.map((item) => {
          const widget = WIDGETS[item.i as WidgetId];
          if (!widget) return null;

          const WidgetComponent = widget.component;

          return (
            <div
              key={item.i}
              className="bg-surface-elevated rounded-xl border border-bdr-default overflow-hidden"
            >
              {/* Widget header (shown in edit mode) */}
              {isEditing && (
                <div className="drag-handle flex items-center justify-between px-4 py-2 bg-surface-default border-b border-bdr-default cursor-move">
                  <span className="flex items-center gap-2 text-sm text-txt-secondary">
                    <DotsSixVertical className="w-4 h-4" />
                    {widget.title}
                  </span>
                </div>
              )}

              {/* Widget content */}
              <div className="p-4 h-full">
                <WidgetComponent />
              </div>
            </div>
          );
        })}
      </ReactGridLayout>

      {/* Edit mode overlay instruction */}
      {isEditing && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-surface-elevated
          border border-bdr-default shadow-lg text-sm text-txt-secondary">
          Drag widgets to rearrange. Resize from edges.
        </div>
      )}
    </div>
  );
}
