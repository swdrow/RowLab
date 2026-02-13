/**
 * AthleteDashboard Component
 * Phase 27-04: Complete athlete dashboard with multi-team unified view
 * Phase 38.1-04: Converted to react-grid-layout matching CoachDashboard quality
 *
 * Per CONTEXT.md:
 * - "Athletes without a team see personal dashboard only (no team sections)"
 * - "Athletes on multiple teams see all team data merged with team labels"
 * - "Athlete dashboard should feel motivating, not clinical"
 */

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveGridLayout, useContainerWidth, Layout as RGLLayout } from 'react-grid-layout';
import { DotsSixVertical, X } from '@phosphor-icons/react';
import { useAuth } from '../../../contexts/AuthContext';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import { useAthleteMultiTeamData } from '../hooks/useAthleteMultiTeamData';
import { useTour } from '../hooks/useTour';
import { PersonalStatsWidget } from './widgets/PersonalStatsWidget';
import { TeamContextCard } from './widgets/TeamContextCard';
import { TourLauncher } from './TourLauncher';
import { EmptyDashboardState } from '../empty-states';
import api from '../../../utils/api';

// Import CSS for react-grid-layout
import 'react-grid-layout/css/styles.css';

/**
 * Athlete dashboard page component
 * Uses react-grid-layout for draggable/resizable widgets
 */
export function AthleteDashboard() {
  const { user, activeTeamId, isAuthenticated } = useAuth();

  // Query the athlete record for the current user to get the real athleteId
  // (user.id is the User table ID, we need the Athlete table ID for ErgTest queries)
  const { data: athleteData } = useQuery({
    queryKey: ['current-athlete', user?.id, activeTeamId],
    queryFn: async () => {
      const response = await api.get(`/api/v1/athletes?userId=${user?.id}`);
      return response.data.data?.athletes?.[0]; // First athlete for this user in active team
    },
    enabled: isAuthenticated && !!user?.id && !!activeTeamId,
    staleTime: 5 * 60 * 1000, // 5 minutes - athlete ID doesn't change often
  });

  const athleteId = athleteData?.id || '';

  const { layout, isEditing, setIsEditing, updateLayout } = useDashboardLayout('athlete');
  const { teams, teamData, personalStats, isLoading } = useAthleteMultiTeamData(athleteId);

  // Container width measurement using react-grid-layout v2 hook
  const { containerRef, width: containerWidth, mounted } = useContainerWidth();

  // Auto-launch tour on first visit
  useTour('athlete-dashboard', { autoStart: true, delay: 800 });

  // Scale widget position from one column count to another
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
      const scaled = scalePosition(widget.position, 12, 8);
      return {
        i: widget.id,
        x: scaled.x,
        y: widget.position.y,
        w: scaled.w,
        h: widget.position.h,
        minW: 2,
        minH: 2,
        maxW: 8,
        maxH: 8,
      };
    });

    const sm = layout.widgets.map((widget) => {
      const scaled = scalePosition(widget.position, 12, 4);
      return {
        i: widget.id,
        x: scaled.x,
        y: widget.position.y,
        w: scaled.w,
        h: widget.position.h,
        minW: 2,
        minH: 2,
        maxW: 4,
        maxH: 8,
      };
    });

    return { lg, md, sm };
  }, [layout.widgets]);

  // Handle layout change from drag/drop
  const handleLayoutChange = (newLayout: RGLLayout[]) => {
    if (!isEditing) return;
    if (!containerWidth || containerWidth < 100) return;

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
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--color-accent-copper)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--color-ink-secondary)]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if athlete has any data at all
  const hasAnyData =
    personalStats.latestErgTime ||
    personalStats.attendanceStreak > 0 ||
    personalStats.totalPRs > 0 ||
    teams.length > 0;

  // Empty state for brand new athletes
  if (!hasAnyData) {
    return (
      <div className="p-6">
        <EmptyDashboardState />
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      {/* Actions Bar (header text provided by CanvasMeDashboard) */}
      <div className="flex items-center justify-end mb-4 gap-3">
        <TourLauncher tourId="athlete-dashboard" variant="button" />
        <button
          data-tour="edit-layout"
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${
            isEditing
              ? 'bg-accent-copper text-ink-deep hover:bg-accent-copper/90'
              : 'border border-white/[0.08] text-ink-bright hover:bg-white/[0.04]'
          }`}
        >
          {isEditing ? 'Done' : 'Edit Layout'}
        </button>
      </div>

      {/* Dashboard Grid - only render when container width is measured */}
      {mounted ? (
        <ResponsiveGridLayout
          className="dashboard-grid"
          layouts={gridLayouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768 }}
          cols={{ lg: 12, md: 8, sm: 4 }}
          rowHeight={60}
          width={containerWidth}
          margin={[16, 16]}
          isDraggable={isEditing}
          isResizable={false}
          draggableHandle=".widget-drag-handle"
          onLayoutChange={handleLayoutChange}
        >
          {layout.widgets.map((widget) => (
            <div
              key={widget.id}
              className={`widget-container ${isEditing ? 'widget-editing' : ''}`}
            >
              <WidgetCard widget={widget} isEditing={isEditing} teams={teams} teamData={teamData} />
            </div>
          ))}
        </ResponsiveGridLayout>
      ) : (
        <div className="grid grid-cols-12 gap-4">
          {[6, 6].map((span, i) => (
            <div
              key={i}
              className={`col-span-${span} h-48 rounded-xl bg-[var(--color-ink-raised)] border border-white/[0.06] animate-pulse`}
            />
          ))}
        </div>
      )}

      {/* Edit Mode Instructions */}
      {isEditing && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-[var(--color-ink-raised)] border border-white/[0.06] rounded-lg shadow-lg">
          <p className="text-sm text-[var(--color-ink-secondary)]">
            <strong className="text-[var(--color-ink-bright)]">Drag</strong> widgets to rearrange.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// WIDGET CARD WRAPPER
// ============================================

interface WidgetCardProps {
  widget: any;
  isEditing: boolean;
  teams: any[];
  teamData: any;
}

/**
 * WidgetCard - Wrapper for individual dashboard widgets
 */
const WidgetCard: React.FC<WidgetCardProps> = ({ widget, isEditing, teams, teamData }) => {
  // Render PersonalStatsWidget or TeamContextCard based on widget type
  if (widget.widgetType === 'personal-stats') {
    return (
      <div className="h-full relative glass-card bg-[var(--color-ink-raised)] border border-white/[0.06] overflow-hidden transition-all hover:border-accent-copper/30">
        {isEditing && (
          <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-void)] border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="widget-drag-handle cursor-grab active:cursor-grabbing">
                <DotsSixVertical className="w-5 h-5 text-[var(--color-ink-tertiary)]" />
              </div>
              <span className="text-sm font-medium text-[var(--color-ink-bright)]">
                Personal Stats
              </span>
            </div>
          </div>
        )}
        <div className={`${isEditing ? 'h-[calc(100%-48px)]' : 'h-full'} overflow-auto`}>
          <PersonalStatsWidget widgetId={widget.id} size={widget.size} isEditing={isEditing} />
        </div>
      </div>
    );
  }

  // Team context card widget
  if (widget.widgetType === 'team-context' && teams.length > 0) {
    const teamIndex = parseInt(widget.id.split('-')[2] || '0');
    const team = teams[teamIndex];
    if (!team) return null;

    return (
      <div className="h-full relative glass-card bg-[var(--color-ink-raised)] border border-white/[0.06] overflow-hidden transition-all hover:border-accent-copper/30">
        {isEditing && (
          <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-void)] border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="widget-drag-handle cursor-grab active:cursor-grabbing">
                <DotsSixVertical className="w-5 h-5 text-[var(--color-ink-tertiary)]" />
              </div>
              <span className="text-sm font-medium text-[var(--color-ink-bright)]">
                Team Context
              </span>
            </div>
          </div>
        )}
        <div className={`${isEditing ? 'h-[calc(100%-48px)]' : 'h-full'} overflow-auto`}>
          <TeamContextCard
            teamName={team.teamName}
            teamId={team.teamId}
            nextWorkout={teamData[team.teamId]?.nextWorkout}
            ranking={teamData[team.teamId]?.ranking}
            attendanceRate={teamData[team.teamId]?.attendanceRate}
            recentActivity={teamData[team.teamId]?.recentActivity}
            compact={teams.length > 2}
          />
        </div>
      </div>
    );
  }

  return null;
};

// ============================================
// CSS ANIMATIONS
// ============================================

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
