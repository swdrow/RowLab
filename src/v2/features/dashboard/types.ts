/**
 * Dashboard Type Definitions
 * Phase 27-01: Widget infrastructure foundation
 */

import type { ComponentType } from 'react';

// Widget size presets
export type WidgetSize = 'compact' | 'normal' | 'expanded';

// Grid dimensions for size presets
export interface WidgetSizeConfig {
  w: number; // width in grid units (12-col grid)
  h: number; // height in grid units
}

// Widget category for organization
export type WidgetCategory = 'overview' | 'metrics' | 'activity' | 'team';

// User roles that can access widgets
export type UserRole = 'coach' | 'athlete' | 'admin';

// Props passed to all widget components
export interface WidgetProps {
  widgetId: string;
  size: WidgetSize;
  isEditing: boolean;
}

// Widget registry configuration
export interface WidgetConfig {
  id: string;
  title: string;
  description: string;
  icon: string; // Phosphor icon name
  category: WidgetCategory;
  roles: UserRole[]; // which roles can use this widget
  sizes: Partial<Record<WidgetSize, WidgetSizeConfig>>; // not all widgets need all 3 sizes
  defaultSize: WidgetSize;
  component: ComponentType<WidgetProps>; // lazy-loaded component
}

// Widget instance placed on a dashboard
export interface WidgetInstance {
  id: string; // instance ID (unique per dashboard)
  widgetType: string; // references WidgetConfig.id
  size: WidgetSize;
  position: {
    x: number; // grid column position
    y: number; // grid row position
    w: number; // width in grid units
    h: number; // height in grid units
  };
}

// Full dashboard layout state
export interface DashboardLayout {
  widgets: WidgetInstance[];
  version: number; // for conflict detection with DB sync
}

// Exception severity levels
export type ExceptionSeverity = 'critical' | 'warning' | 'ok';

// Individual exception item
export interface ExceptionItem {
  id: string;
  severity: ExceptionSeverity;
  title: string;
  description: string;
  widgetId?: string; // which widget this exception belongs to
  actionLabel?: string; // e.g., "View Athletes", "Fix Now"
  actionPath?: string; // route to navigate to
}

// Aggregated exception summary
export interface ExceptionSummary {
  critical: number;
  warning: number;
  ok: number;
  items: ExceptionItem[];
}

// Onboarding wizard step
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: ComponentType;
  isSkippable: boolean; // always true per CONTEXT.md
}

// Helper type for exception color mapping
export type ExceptionColorClass =
  | 'text-status-error'
  | 'text-status-warning'
  | 'text-status-success'
  | 'bg-status-error'
  | 'bg-status-warning'
  | 'bg-status-success';
