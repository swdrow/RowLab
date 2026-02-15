/**
 * Google OAuth Service Tests
 * Tests for Google OAuth authentication and invite validation
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '../db/connection.js';

// Mock environment variables
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3001/api/v1/auth/google/callback';

describe('Google OAuth Service', () => {
  describe('handleGoogleOAuth', () => {
    it('should require a valid invite for new users', async () => {
      const { handleGoogleOAuth } = await import('../services/googleOAuthService.js');
      
      const mockProfile = {
        id: 'google-123',
        emails: [{ value: 'newuser@example.com' }],
        displayName: 'New User',
        name: { givenName: 'New', familyName: 'User' },
      };

      // Should throw error for user without invite
      await expect(handleGoogleOAuth(mockProfile)).rejects.toThrow(
        'No valid invitation found for this email'
      );
    });

    it('should throw error for profile without email', async () => {
      const { handleGoogleOAuth } = await import('../services/googleOAuthService.js');
      
      const mockProfile = {
        id: 'google-123',
        emails: [],
        displayName: 'No Email User',
      };

      await expect(handleGoogleOAuth(mockProfile)).rejects.toThrow(
        'No email found in Google profile'
      );
    });
  });

  describe('generateOAuthResponse', () => {
    it('should format user response with tokens', async () => {
      const { generateOAuthResponse } = await import('../services/googleOAuthService.js');
      
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        isAdmin: false,
        memberships: [
          {
            teamId: 'team-123',
            role: 'ATHLETE',
            team: {
              id: 'team-123',
              name: 'Test Team',
              slug: 'test-team',
            },
          },
        ],
      };

      const response = await generateOAuthResponse(mockUser);

      expect(response).toHaveProperty('user');
      expect(response).toHaveProperty('teams');
      expect(response).toHaveProperty('activeTeamId', 'team-123');
      expect(response).toHaveProperty('accessToken');
      expect(response).toHaveProperty('refreshToken');
      expect(response.user.id).toBe('user-123');
      expect(response.user.email).toBe('test@example.com');
      expect(response.teams).toHaveLength(1);
      expect(response.teams[0].name).toBe('Test Team');
    });

    it('should handle user with no team memberships', async () => {
      const { generateOAuthResponse } = await import('../services/googleOAuthService.js');
      
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        isAdmin: false,
        memberships: [],
      };

      const response = await generateOAuthResponse(mockUser);

      expect(response.activeTeamId).toBe(null);
      expect(response.teams).toHaveLength(0);
    });
  });

  describe('OAuth route configuration', () => {
    it('should have required environment variables configured', () => {
      expect(process.env.GOOGLE_CLIENT_ID).toBeDefined();
      expect(process.env.GOOGLE_CLIENT_SECRET).toBeDefined();
      expect(process.env.GOOGLE_REDIRECT_URI).toBeDefined();
    });
  });
});
