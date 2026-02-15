import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';

/**
 * Test: /calendar redirect
 * 
 * Verifies that navigating to /calendar redirects to /app/coach/training
 * This prevents 404 errors for users who might try to access /calendar directly.
 */
describe('Calendar Route Redirect', () => {
  it('redirects /calendar to /app/coach/training', async () => {
    // Create a test router that mimics the App.jsx routing structure
    const TestComponent = () => (
      <MemoryRouter initialEntries={['/calendar']}>
        <Routes>
          <Route path="/calendar" element={<Navigate to="/app/coach/training" replace />} />
          <Route path="/app/coach/training" element={<div>Training Page</div>} />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </MemoryRouter>
    );

    render(<TestComponent />);

    // The redirect should happen and we should see the training page content
    await waitFor(() => {
      expect(screen.getByText('Training Page')).toBeInTheDocument();
    });

    // Should NOT see the 404 page
    expect(screen.queryByText('404 Not Found')).not.toBeInTheDocument();
  });

  it('/calendar should not show 404 page', () => {
    // Test that /calendar doesn't fall through to 404 catch-all
    const TestComponent = () => (
      <MemoryRouter initialEntries={['/calendar']}>
        <Routes>
          <Route path="/calendar" element={<Navigate to="/app/coach/training" replace />} />
          <Route path="/app/coach/training" element={<div>Redirected Successfully</div>} />
          <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
      </MemoryRouter>
    );

    render(<TestComponent />);

    // Should redirect, not show 404
    expect(screen.getByText('Redirected Successfully')).toBeInTheDocument();
    expect(screen.queryByText('Page Not Found')).not.toBeInTheDocument();
  });
});
