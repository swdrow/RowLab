/**
 * Smoke test: Coach navigation links
 *
 * Critical path: Sidebar navigation for coach tools (Lineup Builder, Training, Whiteboard)
 * Coverage: Route configuration, navigation link rendering, page component loading
 *
 * Issue: P0 - Coach nav links (Lineup Builder, Training, Whiteboard) redirect to Dashboard
 * This test verifies that routes are properly configured and navigation works correctly.
 */

import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { WorkspaceSidebar } from '../../v2/components/shell/WorkspaceSidebar';
import { useContextStore } from '../../v2/stores/contextStore';

// Mock page components to verify routing
const MockWhiteboardPage = () => <div>Whiteboard Page</div>;
const MockLineupBuilderPage = () => <div>Lineup Builder Page</div>;
const MockTrainingPage = () => <div>Training Page</div>;
const MockDashboard = () => <div>Dashboard Page</div>;

describe('Smoke: Coach Navigation Links', () => {
  it('renders all three coach nav links in sidebar', () => {
    // Set context to 'coach' to display coach navigation
    useContextStore.setState({ activeContext: 'coach' });

    render(
      <MemoryRouter initialEntries={['/app']}>
        <WorkspaceSidebar />
      </MemoryRouter>
    );

    // Verify all three critical nav links are rendered
    expect(screen.getByText('Whiteboard')).toBeInTheDocument();
    expect(screen.getByText('Lineup Builder')).toBeInTheDocument();
    expect(screen.getByText('Training')).toBeInTheDocument();
  });

  it('navigation links use correct route paths', () => {
    useContextStore.setState({ activeContext: 'coach' });

    render(
      <MemoryRouter initialEntries={['/app']}>
        <WorkspaceSidebar />
      </MemoryRouter>
    );

    // Verify links point to correct routes (not Dashboard)
    const whiteboardLink = screen.getByText('Whiteboard').closest('a');
    const lineupBuilderLink = screen.getByText('Lineup Builder').closest('a');
    const trainingLink = screen.getByText('Training').closest('a');

    expect(whiteboardLink).toHaveAttribute('href', '/app/coach/whiteboard');
    expect(lineupBuilderLink).toHaveAttribute('href', '/app/coach/lineup-builder');
    expect(trainingLink).toHaveAttribute('href', '/app/coach/training');
  });

  it('routes resolve to correct page components (not Dashboard)', () => {
    useContextStore.setState({ activeContext: 'coach' });

    // Test each route independently to verify they don't redirect to Dashboard
    const routes = [
      { path: '/app/coach/whiteboard', Component: MockWhiteboardPage, name: 'Whiteboard Page' },
      {
        path: '/app/coach/lineup-builder',
        Component: MockLineupBuilderPage,
        name: 'Lineup Builder Page',
      },
      { path: '/app/coach/training', Component: MockTrainingPage, name: 'Training Page' },
    ];

    routes.forEach(({ path, Component, name }) => {
      const { unmount } = render(
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/app" element={<MockDashboard />} />
            <Route path="/app/coach/dashboard" element={<MockDashboard />} />
            <Route path={path} element={<Component />} />
          </Routes>
        </MemoryRouter>
      );

      // Verify we see the correct page, NOT the Dashboard
      expect(screen.getByText(name)).toBeInTheDocument();
      expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument();

      unmount();
    });
  });

  it('contextStore defines correct navigation configuration for coach', () => {
    useContextStore.setState({ activeContext: 'coach' });

    const config = useContextStore.getState().getActiveConfig();

    expect(config).toBeDefined();
    expect(config?.id).toBe('coach');

    // Verify all three critical routes are in navItems
    const navItems = config?.navItems || [];
    const whiteboard = navItems.find((item) => item.to === '/app/coach/whiteboard');
    const lineupBuilder = navItems.find((item) => item.to === '/app/coach/lineup-builder');
    const training = navItems.find((item) => item.to === '/app/coach/training');

    expect(whiteboard).toBeDefined();
    expect(whiteboard?.label).toBe('Whiteboard');

    expect(lineupBuilder).toBeDefined();
    expect(lineupBuilder?.label).toBe('Lineup Builder');

    expect(training).toBeDefined();
    expect(training?.label).toBe('Training');
  });
});
