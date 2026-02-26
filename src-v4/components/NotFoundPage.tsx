/**
 * 404 Not Found page shown for unmatched routes.
 * Provides navigation back to home and a styled empty state.
 */
import { Link } from '@tanstack/react-router';
import { IconMapPinOff, IconHome, IconArrowLeft } from '@/components/icons';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-void-deep p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-void-raised border border-edge-default">
          <IconMapPinOff className="h-8 w-8 text-text-faint" />
        </div>

        <h1 className="text-3xl font-display font-bold text-text-bright tracking-tight">
          Page Not Found
        </h1>
        <p className="mt-3 text-sm text-text-dim leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-accent-teal px-5 py-2.5 text-sm font-medium text-void-deep transition-colors hover:bg-accent-teal-hover"
          >
            <IconHome className="h-4 w-4" />
            Go Home
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-edge-default px-5 py-2.5 text-sm font-medium text-text-dim transition-colors hover:bg-void-overlay hover:text-text-bright"
          >
            <IconArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
