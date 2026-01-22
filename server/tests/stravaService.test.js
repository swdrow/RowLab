/**
 * Strava Service Tests
 *
 * Tests for Strava OAuth flow, activity sync, and C2→Strava sync functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Set up env vars before any imports
process.env.STRAVA_CLIENT_ID = 'test_strava_client_id';
process.env.STRAVA_CLIENT_SECRET = 'test_strava_secret';
process.env.STRAVA_REDIRECT_URI = 'https://rowlab.net/strava/callback';

// Create hoisted mocks
const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}));

const mockPrisma = vi.hoisted(() => ({
  stravaAuth: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  workout: {
    findMany: vi.fn(),
  },
}));

// Mock modules
vi.mock('../utils/logger.js', () => ({
  default: mockLogger,
}));

vi.mock('../db/connection.js', () => ({
  prisma: mockPrisma,
}));

vi.mock('../utils/encryption.js', () => ({
  encrypt: vi.fn((val) => `encrypted_${val}`),
  decrypt: vi.fn((val) => val.replace('encrypted_', '')),
  isEncrypted: vi.fn((val) => val?.startsWith('encrypted_')),
}));

// Mock fetch globally
global.fetch = vi.fn();

// Import the module
const {
  C2_WORKOUT_TYPES,
  generateAuthUrl,
  getC2SyncConfig,
  updateC2SyncConfig,
  createActivity,
} = await import('../services/stravaService.js');

describe('StravaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('C2_WORKOUT_TYPES', () => {
    it('should define all Concept2 workout types with Strava mappings', () => {
      expect(C2_WORKOUT_TYPES).toBeDefined();
      expect(C2_WORKOUT_TYPES.rower).toBeDefined();
      expect(C2_WORKOUT_TYPES.bikeerg).toBeDefined();
      expect(C2_WORKOUT_TYPES.skierg).toBeDefined();
      expect(C2_WORKOUT_TYPES.dynamic).toBeDefined();
      expect(C2_WORKOUT_TYPES.slides).toBeDefined();
    });

    it('should map rower to Rowing activity type', () => {
      expect(C2_WORKOUT_TYPES.rower.stravaType).toBe('Rowing');
    });

    it('should map bikeerg to Ride activity type', () => {
      expect(C2_WORKOUT_TYPES.bikeerg.stravaType).toBe('Ride');
    });

    it('should map skierg to NordicSki activity type', () => {
      expect(C2_WORKOUT_TYPES.skierg.stravaType).toBe('NordicSki');
    });

    it('should have labels for each type', () => {
      Object.values(C2_WORKOUT_TYPES).forEach((type) => {
        expect(type.label).toBeDefined();
        expect(typeof type.label).toBe('string');
      });
    });
  });

  describe('generateAuthUrl', () => {
    it('should generate valid authorization URL with correct scope', () => {
      const url = generateAuthUrl('user123');

      expect(url).toContain('https://www.strava.com/oauth/authorize');
      expect(url).toContain('client_id=test_strava_client_id');
      expect(url).toContain('redirect_uri=');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=');
      // Should include activity:write for C2→Strava uploads
      expect(url).toContain('activity%3Awrite');
    });

    it('should include state parameter with encoded user data', () => {
      const url = generateAuthUrl('user456');
      // State is base64 encoded JSON with userId and timestamp
      expect(url).toContain('state=');
      // Decode and verify it contains userId
      const stateMatch = url.match(/state=([^&]+)/);
      expect(stateMatch).toBeTruthy();
      const decoded = JSON.parse(Buffer.from(decodeURIComponent(stateMatch[1]), 'base64').toString());
      expect(decoded.userId).toBe('user456');
      expect(decoded.timestamp).toBeDefined();
    });
  });

  describe('getC2SyncConfig', () => {
    it('should return sync config for user with Strava auth', async () => {
      mockPrisma.stravaAuth.findUnique.mockResolvedValueOnce({
        userId: 'user123',
        c2ToStravaEnabled: true,
        c2ToStravaTypes: { rower: true, bikeerg: false },
      });

      const config = await getC2SyncConfig('user123');

      expect(config).toEqual({
        enabled: true,
        types: { rower: true, bikeerg: false },
      });
      expect(mockPrisma.stravaAuth.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user123' },
      });
    });

    it('should return default disabled config when user has no Strava auth', async () => {
      mockPrisma.stravaAuth.findUnique.mockResolvedValueOnce(null);

      const config = await getC2SyncConfig('user123');

      expect(config).toEqual({
        enabled: false,
        types: {},
      });
    });

    it('should handle empty types field', async () => {
      mockPrisma.stravaAuth.findUnique.mockResolvedValueOnce({
        userId: 'user123',
        c2ToStravaEnabled: true,
        c2ToStravaTypes: null,
      });

      const config = await getC2SyncConfig('user123');

      expect(config.types).toEqual({});
    });
  });

  describe('updateC2SyncConfig', () => {
    it('should update sync enabled state', async () => {
      mockPrisma.stravaAuth.update.mockResolvedValueOnce({
        userId: 'user123',
        c2ToStravaEnabled: true,
      });

      await updateC2SyncConfig('user123', { enabled: true });

      expect(mockPrisma.stravaAuth.update).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        data: { c2ToStravaEnabled: true },
      });
    });

    it('should update sync types', async () => {
      const types = { rower: true, bikeerg: true, skierg: false };
      mockPrisma.stravaAuth.update.mockResolvedValueOnce({
        userId: 'user123',
        c2ToStravaTypes: types,
      });

      await updateC2SyncConfig('user123', { types });

      expect(mockPrisma.stravaAuth.update).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        data: { c2ToStravaTypes: types },
      });
    });

    it('should update both enabled and types together', async () => {
      const types = { rower: true };
      mockPrisma.stravaAuth.update.mockResolvedValueOnce({
        userId: 'user123',
        c2ToStravaEnabled: false,
        c2ToStravaTypes: types,
      });

      await updateC2SyncConfig('user123', { enabled: false, types });

      expect(mockPrisma.stravaAuth.update).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        data: { c2ToStravaEnabled: false, c2ToStravaTypes: types },
      });
    });
  });

  describe('createActivity', () => {
    it('should create activity on Strava with correct payload', async () => {
      // Mock getValidToken by setting up prisma to return tokens
      mockPrisma.stravaAuth.findUnique.mockResolvedValueOnce({
        userId: 'user123',
        accessToken: 'encrypted_valid_token',
        refreshToken: 'encrypted_refresh',
        tokenExpiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 12345678,
          name: 'Morning Row',
          type: 'Rowing',
        }),
      });

      const activity = {
        name: 'Morning Row',
        type: 'Rowing',
        startDate: '2024-01-15T08:00:00Z',  // camelCase
        elapsedTime: 1800,                   // camelCase
        distance: 5000,
        description: 'Test workout',
      };

      const result = await createActivity('user123', activity);

      expect(result.id).toBe(12345678);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.strava.com/api/v3/activities',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.any(String),
        })
      );
    });

    it('should throw error if required fields are missing', async () => {
      // Mock getValidToken to return a token so we can test field validation
      mockPrisma.stravaAuth.findUnique.mockResolvedValueOnce({
        userId: 'user123',
        accessToken: 'encrypted_valid_token',
        refreshToken: 'encrypted_refresh',
        tokenExpiresAt: new Date(Date.now() + 3600000),
      });

      const activity = {
        name: 'Morning Row',
        // Missing startDate and elapsedTime
      };

      await expect(createActivity('user123', activity))
        .rejects.toThrow('Missing required fields');
    });
  });
});
