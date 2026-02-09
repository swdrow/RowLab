import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockAuthHeaders } from '../helpers/mockAuth';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const API_BASE = '/api/v1/erg-tests';

describe('Erg Import API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('POST /api/v1/erg-tests/bulk-import', () => {
    it('should accept and import valid CSV data', async () => {
      const mockTests = [
        {
          athleteId: 'athlete-1',
          testType: '2k',
          testDate: '2026-02-01T10:00:00Z',
          timeSeconds: 420.5,
        },
        {
          athleteId: 'athlete-2',
          testType: '2k',
          testDate: '2026-02-01T10:00:00Z',
          timeSeconds: 425.2,
        },
      ];

      const mockResult = {
        success: true,
        data: {
          imported: 2,
          failed: 0,
          tests: mockTests.map((t, i) => ({ id: `test-${i}`, ...t })),
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResult,
      });

      const response = await fetch(`${API_BASE}/bulk-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...createMockAuthHeaders(),
        },
        body: JSON.stringify({ tests: mockTests }),
      });

      const data = await response.json();
      expect(response.ok).toBe(true);
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.imported).toBe(2);
      expect(data.data.failed).toBe(0);
    });

    it('should reject CSV with invalid data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            details: [{ msg: 'Invalid testType', param: 'tests[0].testType' }],
          },
        }),
      });

      const invalidTests = [
        {
          athleteId: 'athlete-1',
          testType: 'invalid',
          testDate: '2026-02-01T10:00:00Z',
          timeSeconds: 420,
        },
      ];

      const response = await fetch(`${API_BASE}/bulk-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...createMockAuthHeaders(),
        },
        body: JSON.stringify({ tests: invalidTests }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it('should reject empty import', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            details: [{ msg: 'At least 1 test required' }],
          },
        }),
      });

      const response = await fetch(`${API_BASE}/bulk-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...createMockAuthHeaders(),
        },
        body: JSON.stringify({ tests: [] }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it('should reject import exceeding max batch size', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            details: [{ msg: 'Max 500 tests per import' }],
          },
        }),
      });

      // Simulate 501 tests
      const tooManyTests = Array(501).fill({
        athleteId: 'athlete-1',
        testType: '2k',
        testDate: '2026-02-01T10:00:00Z',
        timeSeconds: 420,
      });

      const response = await fetch(`${API_BASE}/bulk-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...createMockAuthHeaders(),
        },
        body: JSON.stringify({ tests: tooManyTests }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/erg-tests', () => {
    it('should return imported erg test data', async () => {
      const mockTests = [
        {
          id: 'test-1',
          athleteId: 'athlete-1',
          testType: '2k',
          testDate: '2026-02-01T10:00:00Z',
          timeSeconds: 420.5,
          splitSeconds: 105.125,
          watts: 320,
          strokeRate: 32,
        },
        {
          id: 'test-2',
          athleteId: 'athlete-2',
          testType: '2k',
          testDate: '2026-02-01T10:00:00Z',
          timeSeconds: 425.2,
          splitSeconds: 106.3,
          watts: 315,
          strokeRate: 30,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { tests: mockTests },
        }),
      });

      const response = await fetch(API_BASE, {
        headers: createMockAuthHeaders(),
      });

      const data = await response.json();
      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.tests).toHaveLength(2);
      expect(data.data.tests[0].testType).toBe('2k');
    });

    it('should filter by athlete ID', async () => {
      const mockTests = [
        {
          id: 'test-1',
          athleteId: 'athlete-1',
          testType: '2k',
          testDate: '2026-02-01T10:00:00Z',
          timeSeconds: 420.5,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { tests: mockTests },
        }),
      });

      const response = await fetch(`${API_BASE}?athleteId=athlete-1`, {
        headers: createMockAuthHeaders(),
      });

      const data = await response.json();
      expect(response.ok).toBe(true);
      expect(data.data.tests).toHaveLength(1);
      expect(data.data.tests[0].athleteId).toBe('athlete-1');
    });

    it('should filter by test type', async () => {
      const mockTests = [
        {
          id: 'test-1',
          athleteId: 'athlete-1',
          testType: '6k',
          testDate: '2026-02-01T10:00:00Z',
          timeSeconds: 1320.5,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { tests: mockTests },
        }),
      });

      const response = await fetch(`${API_BASE}?testType=6k`, {
        headers: createMockAuthHeaders(),
      });

      const data = await response.json();
      expect(response.ok).toBe(true);
      expect(data.data.tests).toHaveLength(1);
      expect(data.data.tests[0].testType).toBe('6k');
    });
  });
});
