import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input, PasswordInput } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';

export default function LoginPage() {
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Success message from registration redirect
  const successMessage = location.state?.message;

  const validateForm = () => {
    const errors = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field error on change
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }

    // Clear global error
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    await login(formData.email, formData.password);
  };

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 bg-mesh opacity-50 pointer-events-none" />
      <div className="fixed inset-0 bg-hero-glow pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-text-primary mb-2">
            RowLab
          </h1>
          <p className="text-text-secondary">Sign in to your account</p>
        </div>

        {/* Success message */}
        {successMessage && (
          <div className="mb-4 p-4 rounded-lg bg-success/10 border border-success/30 text-success text-sm">
            {successMessage}
          </div>
        )}

        {/* Login Card */}
        <Card variant="elevated" padding="lg" radius="xl">
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Global error */}
              {error && (
                <div className="p-3 rounded-lg bg-spectrum-red/10 border border-spectrum-red/30 text-spectrum-red text-sm">
                  {error}
                </div>
              )}

              {/* Email */}
              <Input
                name="email"
                type="email"
                label="Email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                error={formErrors.email}
                autoComplete="email"
                autoFocus
              />

              {/* Password */}
              <PasswordInput
                name="password"
                label="Password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                error={formErrors.password}
                autoComplete="current-password"
              />

              {/* Forgot password link */}
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-accent hover:text-accent-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full"
              >
                Sign in
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-subtle" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-surface-750 text-text-tertiary">
                  Don't have an account?
                </span>
              </div>
            </div>

            {/* Register link */}
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => window.location.href = '/register'}
            >
              Create account
            </Button>
          </CardContent>
        </Card>

        {/* Join with code */}
        <div className="mt-6 text-center">
          <p className="text-text-tertiary text-sm">
            Have an invite code?{' '}
            <Link
              to="/join"
              className="text-accent hover:text-accent-400 transition-colors"
            >
              Join a team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
