/**
 * Route-level error fallback -- oarbit design system.
 *
 * Used as TanStack Router's `defaultErrorComponent` (global safety net)
 * and per-route `errorComponent` overrides.
 * Renders a branded error page with "Try Again" (reset) and "Go Home" actions.
 * Dev mode shows the error message for debugging.
 */

import { Link } from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { IconAlertTriangle, IconRefresh, IconHome } from '@/components/icons';

export function RouteErrorFallback({ error, reset }: ErrorComponentProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-void-raised border border-edge-default">
          <IconAlertTriangle className="h-8 w-8 text-accent-coral" />
        </div>

        <h1 className="text-2xl font-display font-bold text-text-bright tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm text-text-dim leading-relaxed">
          An unexpected error occurred. You can try again or return to the dashboard.
        </p>

        {import.meta.env.DEV && error instanceof Error && (
          <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-void-deep p-3 text-left text-xs font-mono text-text-faint">
            {error.message}
          </pre>
        )}

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-[5px] bg-accent-teal px-5 py-2.5 text-sm font-medium text-void-deep transition-colors hover:bg-accent-teal-hover"
          >
            <IconRefresh className="h-4 w-4" />
            Try Again
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-[5px] border border-edge-default px-5 py-2.5 text-sm font-medium text-text-dim transition-colors hover:bg-void-overlay hover:text-text-bright"
          >
            <IconHome className="h-4 w-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
