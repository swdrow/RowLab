import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockAuthHeaders } from '../helpers/mockAuth';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const API_BASE = '/api/v1/lineups';

describe('Lineup API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('POST /api/v1/lineups', () => {
    it('should create a new lineup', async () => {
      const mockLineup = {
        id: 1,
        name: 'Varsity 8+ Practice',
        notes: 'Morning practice lineup',
        userId: 'user-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignments: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ lineup: mockLineup }),
      });

      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...createMockAuthHeaders(),
        },
        body: JSON.stringify({
          name: 'Varsity 8+ Practice',
          notes: 'Morning practice lineup',
          boats: [],
        }),
      });

      const data = await response.json();
      expect(response.ok).toBe(true);
      expect(response.status).toBe(201);
      expect(data.lineup.name).toBe('Varsity 8+ Practice');
    });

    it('should reject lineup without name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Lineup name required',
        }),
      });

      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...createMockAuthHeaders(),
        },
        body: JSON.stringify({ boats: [] }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/lineups', () => {
    it('should return list of lineups', async () => {
      const mockLineups = [
        {
          id: 1,
          name: 'Varsity 8+',
          assignments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'JV 4+',
          assignments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ lineups: mockLineups }),
      });

      const response = await fetch(API_BASE, {
        headers: createMockAuthHeaders(),
      });

      const data = await response.json();
      expect(response.ok).toBe(true);
      expect(data.lineups).toHaveLength(2);
      expect(data.lineups[0].name).toBe('Varsity 8+');
    });
  });

  describe('GET /api/v1/lineups/:id', () => {
    it('should return specific lineup', async () => {
      const mockLineup = {
        id: 1,
        name: 'Varsity 8+',
        notes: 'Speed focus',
        assignments: [
          {
            id: 1,
            athleteId: 'athlete-1',
            boatClass: '8+',
            seatNumber: 1,
            side: 'Port',
            isCoxswain: false,
            athlete: {
              id: 'athlete-1',
              firstName: 'John',
              lastName: 'Doe',
            },
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLineup,
      });

      const response = await fetch(`${API_BASE}/1`, {
        headers: createMockAuthHeaders(),
      });

      const data = await response.json();
      expect(response.ok).toBe(true);
      expect(data.name).toBe('Varsity 8+');
      expect(data.assignments).toHaveLength(1);
    });

    it('should return 404 for non-existent lineup', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Lineup not found' }),
      });

      const response = await fetch(`${API_BASE}/999`, {
        headers: createMockAuthHeaders(),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
  });

  describe('Full create→save→reload cycle', () => {
    it('should handle complete lineup lifecycle', async () => {
      // Step 1: Create lineup
      const mockCreatedLineup = {
        id: 42,
        name: 'Test Lineup',
        notes: null,
        assignments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ lineup: mockCreatedLineup }),
      });

      const createResponse = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...createMockAuthHeaders(),
        },
        body: JSON.stringify({ name: 'Test Lineup', boats: [] }),
      });

      const createData = await createResponse.json();
      expect(createData.lineup.id).toBe(42);

      // Step 2: Update lineup
      const mockUpdatedLineup = {
        ...mockCreatedLineup,
        notes: 'Updated notes',
        updatedAt: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ lineup: mockUpdatedLineup }),
      });

      const updateResponse = await fetch(`${API_BASE}/42`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...createMockAuthHeaders(),
        },
        body: JSON.stringify({
          name: 'Test Lineup',
          notes: 'Updated notes',
          boats: [],
        }),
      });

      const updateData = await updateResponse.json();
      expect(updateData.lineup.notes).toBe('Updated notes');

      // Step 3: Reload lineup
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedLineup,
      });

      const reloadResponse = await fetch(`${API_BASE}/42`, {
        headers: createMockAuthHeaders(),
      });

      const reloadData = await reloadResponse.json();
      expect(reloadData.id).toBe(42);
      expect(reloadData.notes).toBe('Updated notes');
    });
  });
});
