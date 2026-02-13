/**
 * Login page route.
 * Public: redirects to / if already authenticated.
 * Contains: LoginForm, GoogleAuthButton, ForgotPassword, link to register.
 */
import { useState } from 'react';
import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { GlassCard } from '@/components/ui/GlassCard';
import { LoginForm } from '@/features/auth/LoginForm';
import { GoogleAuthButton } from '@/features/auth/GoogleAuthButton';
import { ForgotPassword } from '@/features/auth/ForgotPassword';

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute('/login')({
  validateSearch: zodValidator(loginSearchSchema),
  beforeLoad: ({ context }) => {
    // If already authenticated, redirect away from login
    if (context.auth.isInitialized && context.auth.isAuthenticated) {
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
    <div className="flex min-h-screen items-center justify-center bg-ink-deep p-4">
      <div className="w-full max-w-md">
        <GlassCard padding="lg" className="rounded-2xl">
          {/* App wordmark */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-ink-primary font-display">
              Row<span className="text-accent-copper">Lab</span>
            </h1>
            <p className="mt-1.5 text-sm text-ink-secondary">Sign in to your account</p>
          </div>

          {/* Email/password form */}
          <LoginForm redirectTo={redirectTo} onEmailChange={setLoginEmail} />

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-ink-border" />
            <span className="text-xs text-ink-muted uppercase tracking-wider">or</span>
            <div className="h-px flex-1 bg-ink-border" />
          </div>

          {/* Google OAuth */}
          <GoogleAuthButton />

          {/* Forgot password */}
          <div className="mt-5">
            <ForgotPassword defaultEmail={loginEmail} />
          </div>

          {/* Registration link */}
          <div className="mt-6 border-t border-ink-border pt-5 text-center">
            <p className="text-sm text-ink-secondary">
              Have an invite?{' '}
              <Link
                to="/register"
                className="text-accent-copper hover:text-accent-copper-hover font-medium transition-colors duration-150"
              >
                Create an account
              </Link>
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
