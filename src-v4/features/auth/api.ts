/**
 * Auth API functions.
 * All calls use the shared axios instance with auth interceptor.
 */
import { apiClient } from '@/lib/api';

// --- Request types ---

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

interface SwitchTeamRequest {
  teamId: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  password: string;
}

// --- Response types ---

export interface TeamInfo {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  name: string;
  isAdmin?: boolean;
  avatarUrl?: string | null;
}

export interface LoginResponse {
  user: AuthUser;
  teams: TeamInfo[];
  activeTeamId: string | null;
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface MeResponse {
  user: AuthUser & {
    memberships?: Array<{
      role: string;
      team: { id: string; name: string; slug: string };
    }>;
    teams?: TeamInfo[];
  };
}

export interface SwitchTeamResponse {
  accessToken: string;
  team: {
    id: string;
    name: string;
    slug: string;
    role: string;
  };
}

// --- API functions ---

export async function loginWithCredentials(data: LoginRequest) {
  return apiClient.post<LoginResponse>('/api/v1/auth/login', data);
}

export async function register(data: RegisterRequest) {
  return apiClient.post<{ user: AuthUser }>('/api/v1/auth/register', data);
}

export async function refreshSession() {
  return apiClient.post<RefreshResponse>('/api/v1/auth/refresh', null, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  });
}

export async function logout() {
  return apiClient.post<{ message: string }>('/api/v1/auth/logout');
}

export async function getMe() {
  return apiClient.get<MeResponse>('/api/v1/auth/me');
}

export async function switchTeam(data: SwitchTeamRequest) {
  return apiClient.post<SwitchTeamResponse>('/api/v1/auth/switch-team', data);
}

export async function forgotPassword(data: ForgotPasswordRequest) {
  return apiClient.post<{ message: string }>('/api/v1/auth/forgot-password', data);
}

export async function resetPassword(data: ResetPasswordRequest) {
  return apiClient.post<{ message: string }>('/api/v1/auth/reset-password', data);
}

export async function devLogin() {
  return apiClient.post<LoginResponse>('/api/v1/auth/dev-login');
}
