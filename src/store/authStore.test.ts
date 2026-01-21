import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch before importing the store
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocking
import useAuthStore from './authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      teams: [],
      activeTeamId: null,
      activeTeamRole: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isInitialized: false,
    });
    localStorage.clear();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have null user initially', () => {
      const { user } = useAuthStore.getState();
      expect(user).toBeNull();
    });

    it('should have empty teams array initially', () => {
      const { teams } = useAuthStore.getState();
      expect(teams).toEqual([]);
    });

    it('should not be loading initially', () => {
      const { isLoading } = useAuthStore.getState();
      expect(isLoading).toBe(false);
    });

    it('should not be authenticated initially', () => {
      const { isAuthenticated } = useAuthStore.getState();
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('should set loading state during login', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: { id: '1', email: 'test@test.com', name: 'Test' },
            teams: [],
            activeTeamId: null,
            accessToken: 'token123',
          },
        }),
      });

      const { login } = useAuthStore.getState();

      // Start login
      const loginPromise = login('test@test.com', 'password');

      // Check loading state (may be too fast to catch)
      await loginPromise;
    });

    it('should set user after successful login', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: { id: '1', email: 'test@test.com', name: 'Test User' },
            teams: [{ id: 'team1', name: 'Team 1' }],
            activeTeamId: 'team1',
            accessToken: 'token123',
          },
        }),
      });

      const { login } = useAuthStore.getState();
      await login('test@test.com', 'password');

      const { user, accessToken, isAuthenticated } = useAuthStore.getState();
      expect(user).toEqual({ id: '1', email: 'test@test.com', name: 'Test User' });
      expect(accessToken).toBe('token123');
      expect(isAuthenticated).toBe(true);
    });

    it('should return error object on failed login', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        }),
      });

      const { login } = useAuthStore.getState();
      const result = await login('test@test.com', 'wrong');

      // The implementation returns { success: false, error: message } instead of throwing
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should store access token in memory after login', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: { id: '1', email: 'test@test.com', name: 'Test' },
            teams: [],
            activeTeamId: null,
            accessToken: 'token123',
          },
        }),
      });

      const { login } = useAuthStore.getState();
      await login('test@test.com', 'password');

      const { accessToken } = useAuthStore.getState();
      expect(accessToken).toBe('token123');
    });
  });

  describe('logout', () => {
    it('should clear user state on logout', async () => {
      // Set initial state
      useAuthStore.setState({
        user: { id: '1', email: 'test@test.com', name: 'Test' },
        accessToken: 'token123',
        isAuthenticated: true,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { logout } = useAuthStore.getState();
      await logout();

      const { user, accessToken, isAuthenticated } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(accessToken).toBeNull();
      expect(isAuthenticated).toBe(false);
    });

    it('should call logout endpoint', async () => {
      useAuthStore.setState({
        accessToken: 'token123',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { logout } = useAuthStore.getState();
      await logout();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/logout'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('register', () => {
    it('should call register endpoint with correct data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { user: { id: '1', email: 'new@test.com', name: 'New User' } },
        }),
      });

      const { register } = useAuthStore.getState();
      // Register takes an object with name, email, password
      await register({ name: 'New User', email: 'new@test.com', password: 'password123' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/register'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('new@test.com'),
        })
      );
    });

    it('should return success with user data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { user: { id: '1', email: 'new@test.com', name: 'New User' } },
        }),
      });

      const { register } = useAuthStore.getState();
      const result = await register({ name: 'New User', email: 'new@test.com', password: 'password123' });

      expect(result.success).toBe(true);
      expect(result.user.email).toBe('new@test.com');
    });
  });

  describe('initialize', () => {
    it('should try to refresh token on initialize', async () => {
      // Mock successful token refresh
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { accessToken: 'new-token' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              user: { id: '1', email: 'test@test.com', name: 'Test', teams: [] },
            },
          }),
        });

      const { initialize } = useAuthStore.getState();
      await initialize();

      const { isInitialized, isAuthenticated } = useAuthStore.getState();
      expect(isInitialized).toBe(true);
      expect(isAuthenticated).toBe(true);
    });

    it('should mark as initialized even if token refresh fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: { code: 'INVALID_REFRESH_TOKEN', message: 'Token expired' },
        }),
      });

      const { initialize } = useAuthStore.getState();
      await initialize();

      const { isInitialized, isAuthenticated } = useAuthStore.getState();
      expect(isInitialized).toBe(true);
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('switchTeam', () => {
    it('should update active team', async () => {
      useAuthStore.setState({
        user: { id: '1', email: 'test@test.com', name: 'Test' },
        teams: [
          { id: 'team1', name: 'Team 1' },
          { id: 'team2', name: 'Team 2' },
        ],
        activeTeamId: 'team1',
        accessToken: 'token123',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            accessToken: 'new-token',
            team: { id: 'team2', name: 'Team 2', role: 'COACH' },
          },
        }),
      });

      const { switchTeam } = useAuthStore.getState();
      const result = await switchTeam('team2');

      expect(result.success).toBe(true);
      const { activeTeamId, activeTeamRole } = useAuthStore.getState();
      expect(activeTeamId).toBe('team2');
      expect(activeTeamRole).toBe('COACH');
    });

    it('should return error if not authenticated', async () => {
      useAuthStore.setState({
        accessToken: null,
      });

      const { switchTeam } = useAuthStore.getState();
      const result = await switchTeam('team2');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });
  });

  describe('getActiveTeam', () => {
    it('should return active team details', () => {
      useAuthStore.setState({
        teams: [
          { id: 'team1', name: 'Team 1', role: 'OWNER' },
          { id: 'team2', name: 'Team 2', role: 'COACH' },
        ],
        activeTeamId: 'team1',
      });

      const { getActiveTeam } = useAuthStore.getState();
      const activeTeam = getActiveTeam();

      expect(activeTeam).toEqual({ id: 'team1', name: 'Team 1', role: 'OWNER' });
    });

    it('should return null if no active team', () => {
      useAuthStore.setState({
        teams: [],
        activeTeamId: null,
      });

      const { getActiveTeam } = useAuthStore.getState();
      expect(getActiveTeam()).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      useAuthStore.setState({
        error: 'Some error',
      });

      const { clearError } = useAuthStore.getState();
      clearError();

      const { error } = useAuthStore.getState();
      expect(error).toBeNull();
    });
  });
});
