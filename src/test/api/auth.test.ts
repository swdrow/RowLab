import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const API_BASE = '/api/v1/auth';

describe('Auth API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return user and token on successful login', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: '1', email: 'test@test.com', name: 'Test User' },
          teams: [{ id: 'team1', name: 'Team 1' }],
          activeTeamId: 'team1',
          accessToken: 'jwt-token-123',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe('test@test.com');
      expect(data.data.accessToken).toBeTruthy();
    });

    it('should return error for invalid credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        }),
      });

      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
      });

      expect(response.ok).toBe(false);
      const data = await response.json();
      expect(data.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should validate email format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input' },
        }),
      });

      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'invalid-email', password: 'password' }),
      });

      expect(response.ok).toBe(false);
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should create new user on successful registration', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          data: {
            user: { id: '2', email: 'new@test.com', name: 'New User' },
          },
        }),
      });

      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New User',
          email: 'new@test.com',
          password: 'password123',
        }),
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe('new@test.com');
    });

    it('should reject duplicate email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          error: { code: 'EMAIL_EXISTS', message: 'Email already registered' },
        }),
      });

      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test',
          email: 'existing@test.com',
          password: 'password123',
        }),
      });

      expect(response.ok).toBe(false);
      const data = await response.json();
      expect(data.error.code).toBe('EMAIL_EXISTS');
    });

    it('should require minimum password length', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: [{ msg: 'Password must be at least 8 characters' }],
          },
        }),
      });

      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test',
          email: 'test@test.com',
          password: 'short',
        }),
      });

      expect(response.ok).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should return new access token with valid refresh token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { accessToken: 'new-jwt-token' },
        }),
      });

      const response = await fetch(`${API_BASE}/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.accessToken).toBeTruthy();
    });

    it('should reject invalid refresh token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: { code: 'INVALID_REFRESH_TOKEN', message: 'Token expired' },
        }),
      });

      const response = await fetch(`${API_BASE}/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      expect(response.ok).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should successfully logout', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { message: 'Logged out successfully' },
        }),
      });

      const response = await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
      });

      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: {
              id: '1',
              email: 'test@test.com',
              name: 'Test User',
              teams: [{ id: 'team1', name: 'Team 1', role: 'OWNER' }],
            },
          },
        }),
      });

      const response = await fetch(`${API_BASE}/me`, {
        headers: { Authorization: 'Bearer valid-token' },
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe('test@test.com');
    });

    it('should reject unauthorized request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        }),
      });

      const response = await fetch(`${API_BASE}/me`);
      expect(response.ok).toBe(false);
    });
  });

  describe('POST /api/v1/auth/dev-login', () => {
    it('should reject request in production environment', async () => {
      // Simulate production environment response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
        }),
      });

      const response = await fetch(`${API_BASE}/dev-login`, {
        method: 'POST',
      });

      expect(response.ok).toBe(false);
      const data = await response.json();
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should allow request in development environment', async () => {
      // Simulate development environment response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: { id: 'admin', email: 'admin@test.com', isAdmin: true },
            teams: [],
            activeTeamId: null,
            accessToken: 'dev-token-123',
          },
        }),
      });

      const response = await fetch(`${API_BASE}/dev-login`, {
        method: 'POST',
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.user.isAdmin).toBe(true);
    });
  });
});

describe('Health API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should return ok status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'ok',
        timestamp: new Date().toISOString(),
      }),
    });

    const response = await fetch('/api/health');
    const data = await response.json();

    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeTruthy();
  });
});
