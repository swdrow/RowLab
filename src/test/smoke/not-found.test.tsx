/**
 * Smoke test: 404 Not Found page
 *
 * Critical path: Invalid routes display custom 404 page
 * Coverage: Catch-all route, NotFoundPage rendering, navigation buttons
 */

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/renderWithProviders';
import NotFoundPage from '../../pages/NotFoundPage';

describe('Smoke: Not Found Page', () => {
  it('renders 404 page with rowing theme', () => {
    renderWithProviders(<NotFoundPage />);

    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    expect(
      screen.getByText(/Looks like you've rowed off course/i)
    ).toBeInTheDocument();
  });

  it('displays navigation buttons', () => {
    renderWithProviders(<NotFoundPage />);

    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('has correct link to dashboard', () => {
    renderWithProviders(<NotFoundPage />);

    const dashboardLink = screen.getByText('Back to Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/app');
  });
});
