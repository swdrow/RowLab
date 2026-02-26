/**
 * Auth-related types used across the v4 frontend.
 */

export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  avatarUrl: string | null;
  isAdmin?: boolean;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  generatedId?: string;
  role: string;
  memberCount?: number;
}

export interface AuthState {
  isInitialized: boolean;
  isAuthenticated: boolean;
  user: User | null;
  teams: Team[];
  activeTeamId: string | null;
  activeTeamRole: string | null;
}

export interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchTeam: (teamId: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
}
