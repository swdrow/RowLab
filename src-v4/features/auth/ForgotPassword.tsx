/**
 * Inline forgot password section.
 * Expandable below the login form (no page navigation).
 * Uses motion AnimatePresence for smooth expand/collapse.
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'motion/react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { forgotPassword } from './api';
import { isAxiosError } from 'axios';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

interface ForgotPasswordProps {
  /** Pre-fill with the email from the login form */
  defaultEmail?: string;
}

export function ForgotPassword({ defaultEmail = '' }: ForgotPasswordProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: defaultEmail,
    },
  });

  const onSubmit = async (data: ForgotFormData) => {
    setServerError(null);
    try {
      await forgotPassword({ email: data.email });
      setIsSuccess(true);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const message =
          error.response?.data?.error?.message || 'Failed to send reset link. Please try again.';
        setServerError(message);
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleToggle = () => {
    if (isOpen) {
      // Closing: reset state
      setIsOpen(false);
      setIsSuccess(false);
      setServerError(null);
      reset({ email: defaultEmail });
    } else {
      // Opening: pre-fill email and reset
      reset({ email: defaultEmail });
      setIsOpen(true);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={handleToggle}
        className="text-sm text-text-dim hover:text-accent-teal transition-colors duration-150"
      >
        {isOpen ? 'Back to login' : 'Forgot your password?'}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full overflow-hidden"
          >
            <div className="pt-4">
              {isSuccess ? (
                <div className="rounded-lg bg-data-excellent/10 border border-data-excellent/20 px-3 py-2.5 text-sm text-data-excellent text-center">
                  Check your email for a reset link.
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
                  {serverError && (
                    <div className="rounded-lg bg-data-poor/10 border border-data-poor/20 px-3 py-2.5 text-sm text-data-poor">
                      {serverError}
                    </div>
                  )}

                  <Input
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    error={errors.email?.message}
                    {...register('email')}
                  />

                  <Button
                    type="submit"
                    variant="secondary"
                    loading={isSubmitting}
                    className="w-full"
                  >
                    Send reset link
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
