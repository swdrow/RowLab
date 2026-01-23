/**
 * Context system types
 * Defines the three persona contexts (Me, Coach, Admin) and navigation structure
 */

/**
 * User context represents the active persona/workspace
 * - me: Athlete view (personal workouts, progress)
 * - coach: Coach view (athletes, plans, lineups)
 * - admin: Admin view (users, teams, settings)
 */
export type Context = 'me' | 'coach' | 'admin';

/**
 * Navigation item for sidebar
 */
export interface NavItem {
  /** React Router path */
  to: string;
  /** Display label */
  label: string;
  /** Icon component or icon name */
  icon: string;
}

/**
 * Context configuration mapping
 * Maps each context to its navigation items, label, and icon
 */
export interface ContextConfig {
  /** Context identifier */
  id: Context;
  /** Display label for the context */
  label: string;
  /** Icon for context rail */
  icon: string;
  /** Navigation items for this context */
  navItems: NavItem[];
  /** Keyboard shortcut hint */
  shortcut: string;
}
