/**
 * Login page route.
 * Public: redirects to / if already authenticated.
 * Contains: LoginForm, GoogleAuthButton, ForgotPassword, link to register.
 */
import { useState } from 'react';
import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { RouteErrorFallback } from '@/components/error/RouteErrorFallback';
import { z } from 'zod';
import { Card } from '@/components/ui/Card';
import { LoginForm } from '@/features/auth/LoginForm';
import { GoogleAuthButton } from '@/features/auth/GoogleAuthButton';
import { ForgotPassword } from '@/features/auth/ForgotPassword';

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute('/login')({
  validateSearch: zodValidator(loginSearchSchema),
  errorComponent: RouteErrorFallback,
  beforeLoad: ({ context }) => {
    // If already authenticated, redirect away from login
    if (context.auth?.isInitialized && context.auth?.isAuthenticated) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage,
  staticData: {
    breadcrumb: 'Login',
  },
});

function LoginPage() {
  const { redirect: redirectTo } = Route.useSearch();
  const [loginEmail, setLoginEmail] = useState('');

  return (
    <div className="flex min-h-screen items-center justify-center bg-void-deep p-4">
      <div className="w-full max-w-md">
        <Card padding="lg" className="rounded-2xl">
          {/* App wordmark */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-text-bright font-display">
              oar<span className="text-accent-teal">bit</span>
            </h1>
            <p className="mt-1.5 text-sm text-text-dim">Sign in to your account</p>
          </div>

          {/* Email/password form */}
          <LoginForm redirectTo={redirectTo} onEmailChange={setLoginEmail} />

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-edge-default" />
            <span className="text-xs text-text-faint uppercase tracking-wider">or</span>
            <div className="h-px flex-1 bg-edge-default" />
          </div>

          {/* Google OAuth */}
          <GoogleAuthButton />

          {/* Forgot password */}
          <div className="mt-5">
            <ForgotPassword defaultEmail={loginEmail} />
          </div>

          {/* Registration link */}
          <div className="mt-6 border-t border-edge-default pt-5 text-center">
            <p className="text-sm text-text-dim">
              Have an invite?{' '}
              <Link
                to="/register"
                className="text-accent-teal hover:text-accent-teal-hover font-medium transition-colors duration-150"
              >
                Create an account
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
