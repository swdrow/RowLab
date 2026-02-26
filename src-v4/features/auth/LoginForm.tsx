/**
 * Login form with email/password fields.
 * Uses react-hook-form + zod for validation.
 * Calls useAuth().login on submit and navigates to redirect or /.
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from '@tanstack/react-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from './useAuth';
import { setAccessToken } from '@/lib/api';
import { isAxiosError } from 'axios';

const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  redirectTo?: string;
  onEmailChange?: (email: string) => void;
}

export function LoginForm({ redirectTo, onEmailChange }: LoginFormProps) {
  const { login, refreshAuth } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
      await navigate({ to: redirectTo || '/' });
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const message =
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          'Login failed. Please check your credentials.';
        setServerError(message);
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
  };

  // Dev-login state kept as unconditional hook (React rules),
  // but the button JSX and handler are gated behind import.meta.env.DEV
  // so Vite tree-shakes the entire dev-login block from production bundles.
  const [devLoading, setDevLoading] = useState(false);

  const handleDevLogin = async () => {
    setServerError(null);
    setDevLoading(true);
    try {
      const { devLogin: devLoginApi } = await import('./api');
      const data = await devLoginApi();
      setAccessToken(data.accessToken);
      await refreshAuth();
      await navigate({ to: redirectTo || '/' });
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        setServerError(error.response?.data?.error?.message || 'Dev login unavailable');
      } else {
        setServerError('Dev login failed');
      }
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {serverError && (
        <div className="rounded-lg bg-data-poor/10 border border-data-poor/20 px-3 py-2.5 text-sm text-data-poor">
          {serverError}
        </div>
      )}

      <Input
        label="Email or username"
        type="text"
        autoComplete="email"
        placeholder="you@example.com or username"
        error={errors.email?.message}
        {...register('email', {
          onChange: (e) => onEmailChange?.(e.target.value),
        })}
      />

      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="Enter your password"
        error={errors.password?.message}
        {...register('password')}
      />

      <Button type="submit" loading={isSubmitting} className="mt-1 w-full" size="lg">
        Sign in
      </Button>

      {/* Dev login — gated behind import.meta.env.DEV so Vite tree-shakes it from production */}
      {import.meta.env.DEV && (
        <button
          type="button"
          onClick={handleDevLogin}
          disabled={devLoading}
          className="mt-3 w-full rounded-lg border border-edge-default px-4 py-2.5 text-sm text-text-dim transition-colors hover:bg-void-raised hover:text-text-default disabled:opacity-50"
        >
          {devLoading ? 'Signing in...' : 'Dev Login (admin)'}
        </button>
      )}
    </form>
  );
}
