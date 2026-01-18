import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input, PasswordInput } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';

export default function RegisterPage() {
  const { register, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    if (!formData.name?.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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

    await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });
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
          <p className="text-text-secondary">Create your account</p>
        </div>

        {/* Register Card */}
        <Card variant="elevated" padding="lg" radius="xl">
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Global error */}
              {error && (
                <div className="p-3 rounded-lg bg-spectrum-red/10 border border-spectrum-red/30 text-spectrum-red text-sm">
                  {error}
                </div>
              )}

              {/* Name */}
              <Input
                name="name"
                type="text"
                label="Full Name"
                placeholder="John Smith"
                value={formData.name}
                onChange={handleChange}
                error={formErrors.name}
                autoComplete="name"
                autoFocus
              />

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
              />

              {/* Password */}
              <PasswordInput
                name="password"
                label="Password"
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={handleChange}
                error={formErrors.password}
                autoComplete="new-password"
                hint="Must be at least 8 characters"
              />

              {/* Confirm Password */}
              <PasswordInput
                name="confirmPassword"
                label="Confirm Password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={formErrors.confirmPassword}
                autoComplete="new-password"
              />

              {/* Submit */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full"
              >
                Create account
              </Button>

              {/* Terms */}
              <p className="text-xs text-text-tertiary text-center">
                By creating an account, you agree to our{' '}
                <Link to="/terms" className="text-accent hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-accent hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-subtle" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-surface-750 text-text-tertiary">
                  Already have an account?
                </span>
              </div>
            </div>

            {/* Login link */}
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => window.location.href = '/login'}
            >
              Sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
