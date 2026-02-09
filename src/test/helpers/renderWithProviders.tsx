import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

/**
 * Custom render function that wraps components with all required providers
 * for isolated testing: QueryClient, Router, etc.
 *
 * Usage:
 *   const { getByText } = renderWithProviders(<MyComponent />);
 *
 * Options:
 *   - initialEntries: Router initial paths (default: ['/'])
 *   - queryClient: Custom QueryClient instance (optional)
 *   - ...renderOptions: All react-testing-library render options
 */

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    initialEntries = ['/'],
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    }),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
