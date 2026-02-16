/**
 * Navigation type definitions.
 * Zones control visibility based on user role and team membership.
 */
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  search?: Record<string, string>;
  badge?: number;
  zone: 'personal' | 'team' | 'coach';
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export interface NavConfig {
  sections: NavSection[];
  bottomTabItems: NavItem[];
}
