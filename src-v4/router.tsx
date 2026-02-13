import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export interface RouterContext {
  auth: {
    isAuthenticated: boolean;
    isInitialized: boolean;
    user: User | null;
    activeTeamId: string | null;
    activeTeamRole: string | null;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
  },
  defaultPreloadStaleTime: 0,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
