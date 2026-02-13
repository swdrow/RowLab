/**
 * Registration form with invite support.
 * Uses react-hook-form + zod for validation.
 * Pre-fills email from invite, auto-logins on success.
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from '@tanstack/react-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from './useAuth';
import { register as registerApi } from './api';
import { isAxiosError } from 'axios';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  inviteToken?: string;
  prefilledEmail?: string;
  emailLocked?: boolean;
  assignedRole?: string;
}

export function RegisterForm({
  inviteToken,
  prefilledEmail = '',
  emailLocked = false,
  assignedRole,
}: RegisterFormProps) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: prefilledEmail,
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      // Register the account
      await registerApi({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      // Auto-login after successful registration
      await login(data.email, data.password);
      await navigate({ to: '/' });
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const message =
          error.response?.data?.error?.message || 'Registration failed. Please try again.';
        setServerError(message);
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {serverError && (
        <div className="rounded-lg bg-data-poor/10 border border-data-poor/20 px-3 py-2.5 text-sm text-data-poor">
          {serverError}
        </div>
      )}

      {assignedRole && (
        <div className="rounded-lg bg-accent-copper/10 border border-accent-copper/20 px-3 py-2.5 text-sm text-accent-copper text-center">
          You've been invited as a{' '}
          <span className="font-semibold capitalize">{assignedRole.toLowerCase()}</span>
        </div>
      )}

      <Input
        label="Full name"
        type="text"
        autoComplete="name"
        placeholder="Your name"
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        disabled={emailLocked}
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        error={errors.password?.message}
        {...register('password')}
      />

      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        placeholder="Confirm your password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      {inviteToken && <input type="hidden" value={inviteToken} name="inviteToken" />}

      <Button type="submit" loading={isSubmitting} className="mt-1 w-full" size="lg">
        Create account
      </Button>
    </form>
  );
}
