/**
 * Auth API functions.
 * All calls use the shared axios instance with auth interceptor.
 */
import { api } from '@/lib/api';
import type { ApiResponse } from '@/types/api';

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
  const res = await api.post<ApiResponse<LoginResponse>>('/api/v1/auth/login', data);
  return res.data.data;
}

export async function register(data: RegisterRequest) {
  const res = await api.post<ApiResponse<{ user: AuthUser }>>('/api/v1/auth/register', data);
  return res.data.data;
}

export async function refreshSession() {
  const res = await api.post<ApiResponse<RefreshResponse>>('/api/v1/auth/refresh', null, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  });
  return res.data.data;
}

export async function logout() {
  const res = await api.post<ApiResponse<{ message: string }>>('/api/v1/auth/logout');
  return res.data.data;
}

export async function getMe() {
  const res = await api.get<ApiResponse<MeResponse>>('/api/v1/auth/me');
  return res.data.data;
}

export async function switchTeam(data: SwitchTeamRequest) {
  const res = await api.post<ApiResponse<SwitchTeamResponse>>('/api/v1/auth/switch-team', data);
  return res.data.data;
}

export async function forgotPassword(data: ForgotPasswordRequest) {
  const res = await api.post<ApiResponse<{ message: string }>>(
    '/api/v1/auth/forgot-password',
    data
  );
  return res.data;
}

export async function resetPassword(data: ResetPasswordRequest) {
  const res = await api.post<ApiResponse<{ message: string }>>('/api/v1/auth/reset-password', data);
  return res.data;
}

export async function devLogin() {
  const res = await api.post<ApiResponse<LoginResponse>>('/api/v1/auth/dev-login');
  return res.data.data;
}
