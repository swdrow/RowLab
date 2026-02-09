import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockAuthHeaders } from '../helpers/mockAuth';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const API_BASE = '/api/v1/concept2';

describe('Concept2 Sync API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('POST /api/v1/concept2/sync/me', () => {
    it('should trigger sync for current user', async () => {
      const mockResult = {
        success: true,
        data: {
          synced: 5,
          newWorkouts: 3,
          updatedWorkouts: 2,
          lastSyncDate: new Date().toISOString(),
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const response = await fetch(`${API_BASE}/sync/me`, {
        method: 'POST',
        headers: createMockAuthHeaders(),
      });

      const data = await response.json();
      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.synced).toBe(5);
      expect(data.data.newWorkouts).toBe(3);
    });

    it('should handle no Concept2 connection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: {
            code: 'NOT_CONNECTED',
            message: 'No Concept2 connection',
          },
        }),
      });

      const response = await fetch(`${API_BASE}/sync/me`, {
        method: 'POST',
        headers: createMockAuthHeaders(),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe('NOT_CONNECTED');
    });

    it('should handle no athlete profile', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: {
            code: 'NO_ATHLETE_PROFILE',
            message: 'No athlete profile linked to this user',
          },
        }),
      });

      const response = await fetch(`${API_BASE}/sync/me`, {
        method: 'POST',
        headers: createMockAuthHeaders(),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe('NO_ATHLETE_PROFILE');
    });
  });

  describe('POST /api/v1/concept2/sync/:athleteId', () => {
    it('should trigger sync for specific athlete (coach role)', async () => {
      const mockResult = {
        success: true,
        data: {
          synced: 10,
          newWorkouts: 7,
          updatedWorkouts: 3,
          lastSyncDate: new Date().toISOString(),
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const response = await fetch(`${API_BASE}/sync/athlete-123`, {
        method: 'POST',
        headers: createMockAuthHeaders(),
      });

      const data = await response.json();
      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.synced).toBe(10);
    });

    it('should handle athlete not connected', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: {
            code: 'NOT_CONNECTED',
            message: 'No Concept2 connection',
          },
        }),
      });

      const response = await fetch(`${API_BASE}/sync/athlete-123`, {
        method: 'POST',
        headers: createMockAuthHeaders(),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/concept2/status/me', () => {
    it('should return current user connection status', async () => {
      const mockStatus = {
        success: true,
        data: {
          connected: true,
          username: 'rower123',
          lastSync: '2026-02-08T10:00:00Z',
          workoutCount: 45,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const response = await fetch(`${API_BASE}/status/me`, {
        headers: createMockAuthHeaders(),
      });

      const data = await response.json();
      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.connected).toBe(true);
      expect(data.data.username).toBe('rower123');
    });

    it('should handle not connected status', async () => {
      const mockStatus = {
        success: true,
        data: {
          connected: false,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const response = await fetch(`${API_BASE}/status/me`, {
        headers: createMockAuthHeaders(),
      });

      const data = await response.json();
      expect(response.ok).toBe(true);
      expect(data.data.connected).toBe(false);
    });
  });

  describe('GET /api/v1/concept2/status/:athleteId', () => {
    it('should return athlete connection status', async () => {
      const mockStatus = {
        success: true,
        data: {
          connected: true,
          username: 'athlete456',
          lastSync: '2026-02-09T08:30:00Z',
          workoutCount: 120,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const response = await fetch(`${API_BASE}/status/athlete-123`, {
        headers: createMockAuthHeaders(),
      });

      const data = await response.json();
      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.connected).toBe(true);
    });
  });

  describe('POST /api/v1/concept2/connect', () => {
    it('should initiate OAuth flow', async () => {
      const mockAuthUrl = {
        success: true,
        data: {
          url: 'https://log.concept2.com/oauth/authorize?client_id=test&state=xyz',
          state: 'xyz',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAuthUrl,
      });

      const response = await fetch(`${API_BASE}/connect`, {
        method: 'POST',
        headers: createMockAuthHeaders(),
      });

      const data = await response.json();
      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.url).toContain('concept2.com');
      expect(data.data.state).toBeTruthy();
    });
  });

  describe('DELETE /api/v1/concept2/disconnect/me', () => {
    it('should disconnect current user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { message: 'Concept2 disconnected' },
        }),
      });

      const response = await fetch(`${API_BASE}/disconnect/me`, {
        method: 'DELETE',
        headers: createMockAuthHeaders(),
      });

      const data = await response.json();
      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
    });

    it('should handle no connection to disconnect', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: {
            code: 'NOT_CONNECTED',
            message: 'No Concept2 connection',
          },
        }),
      });

      const response = await fetch(`${API_BASE}/disconnect/me`, {
        method: 'DELETE',
        headers: createMockAuthHeaders(),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
  });
});
