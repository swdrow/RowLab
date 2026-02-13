/**
 * Login page placeholder. Full implementation in Plan 03 (login form, Google OAuth).
 * This stub exists so that auth guards can redirect to /login.
 */
import { createFileRoute } from '@tanstack/react-router';

interface LoginSearch {
  redirect?: string;
}

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginPage,
  staticData: {
    breadcrumb: 'Login',
  },
});

function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-deep">
      <div className="glass max-w-sm rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-semibold text-ink-primary">RowLab</h1>
        <p className="mt-2 text-sm text-ink-secondary">Login form will be built in Plan 03.</p>
      </div>
    </div>
  );
}
