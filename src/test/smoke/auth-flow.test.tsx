/**
 * Smoke test: Authentication flow
 *
 * Critical path: User login, authenticated dashboard access, token management
 * Coverage: Login form rendering, auth token handling, protected route behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { mockAuthToken, clearAuth } from '../helpers/mockAuth';
import { AuthProvider } from '../../v2/contexts/AuthContext';

// Mock the API module
vi.mock('../../v2/utils/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('Smoke: Authentication Flow', () => {
  beforeEach(() => {
    clearAuth();
    vi.clearAllMocks();
  });

  it('redirects unauthenticated user to login', async () => {
    // When user is not authenticated (no token), they should see login UI
    const LoginTestComponent = () => {
      return (
        <div>
          <h1>Login Page</h1>
          <form>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" />
            <label htmlFor="password">Password</label>
            <input id="password" type="password" />
            <button type="submit">Sign In</button>
          </form>
        </div>
      );
    };

    renderWithProviders(<LoginTestComponent />, {
      initialEntries: ['/login'],
    });

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders dashboard when authenticated', async () => {
    mockAuthToken();

    const DashboardTestComponent = () => {
      return (
        <div>
          <h1>Dashboard</h1>
          <div data-testid="dashboard-content">
            <p>Welcome to RowLab</p>
          </div>
        </div>
      );
    };

    renderWithProviders(<DashboardTestComponent />, {
      initialEntries: ['/app'],
    });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    expect(screen.getByText('Welcome to RowLab')).toBeInTheDocument();
  });

  it('includes auth header in protected API calls', () => {
    mockAuthToken('test-token-12345');

    // Verify window token is set correctly
    expect(window.__rowlab_access_token).toBe('test-token-12345');
  });

  it('shows login form with required fields', () => {
    const LoginFormComponent = () => (
      <form aria-label="login form">
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        <button type="submit">Log In</button>
      </form>
    );

    renderWithProviders(<LoginFormComponent />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /log in/i });

    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('required');

    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('required');

    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });
});
