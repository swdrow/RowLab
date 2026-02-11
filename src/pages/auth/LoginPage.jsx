import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import SpotlightCard from '../../components/ui/SpotlightCard';

// ============================================
// INPUT COMPONENT - Precision style
// ============================================
const InputField = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
  autoFocus,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  // Generate unique ID for accessibility
  const inputId = `input-${name}`;

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-xs font-mono font-medium text-text-muted uppercase tracking-wider"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-describedby={error ? `${inputId}-error` : undefined}
          aria-invalid={error ? 'true' : 'false'}
          className={`
            w-full px-4 py-3 rounded-xl
            bg-void-elevated/50 border
            text-text-primary placeholder:text-text-muted
            focus:outline-none transition-all
            ${
              error
                ? 'border-danger-red/40 focus:border-danger-red focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
                : 'border-white/[0.06] focus:border-blade-blue/40 focus:shadow-[0_0_0_3px_rgba(0,112,243,0.1)]'
            }
          `}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors text-sm"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error && (
        <motion.p
          id={`${inputId}-error`}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-danger-red flex items-center gap-1"
          role="alert"
        >
          <AlertCircle className="w-3 h-3" aria-hidden="true" />
          {error}
        </motion.p>
      )}
    </div>
  );
};

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});
  // Auto dev-login from localhost/Tailscale/private networks
  // Module-level flag survives SPA remounts but resets on full page reload
  useEffect(() => {
    if (window.__rowlab_access_token) {
      // Token already exists — just navigate, don't re-login
      const from = location.state?.from?.pathname || '/app';
      navigate(from, { replace: true });
      return;
    }

    if (window.__devLoginAttempted) return;

    const host = window.location.hostname;
    const isDev =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('100.') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.');
    if (!isDev) return;

    window.__devLoginAttempted = true;

    (async () => {
      try {
        const res = await fetch('/api/v1/auth/dev-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
          const { accessToken } = data.data;
          window.__rowlab_access_token = accessToken;
          const from = location.state?.from?.pathname || '/app';
          navigate(from, { replace: true });
        }
      } catch {
        // Dev login not available, show normal login form
      }
    })();
  }, [location, navigate]);

  // Success message from registration redirect
  const successMessage = location.state?.message;

  const validateForm = () => {
    const errors = {};

    if (!formData.email) {
      errors.email = 'Email or username is required';
    }
    // No email format validation - allow username login for admins

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
    <div className="min-h-screen bg-void-deep flex flex-col items-center justify-center p-4">
      {/* Background atmosphere - void glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blade-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-coxswain-violet/5 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blade-blue/10 border border-blade-blue/20 mb-4 shadow-[0_0_30px_rgba(0,112,243,0.2)]">
            <Layers className="w-7 h-7 text-blade-blue" />
          </div>
          <h1 className="text-3xl font-display font-bold text-text-primary tracking-[-0.02em] mb-1">
            Welcome back
          </h1>
          <p className="text-text-secondary text-sm">Sign in to your RowLab account</p>
        </div>

        {/* Success message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-xl bg-blade-blue/10 border border-blade-blue/20 text-blade-blue text-sm flex items-center gap-3"
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {successMessage}
          </motion.div>
        )}

        {/* Login Card */}
        <SpotlightCard
          className={`
            rounded-2xl
            bg-void-elevated border border-white/5
            shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)]
          `}
        >
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Global error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-danger-red/10 border border-danger-red/20 text-danger-red text-sm flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              {/* Email or Username */}
              <InputField
                name="email"
                type="text"
                label="Email or Username"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                error={formErrors.email}
                autoComplete="username"
                autoFocus
              />

              {/* Password */}
              <InputField
                name="password"
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                error={formErrors.password}
                autoComplete="current-password"
              />

              {/* Forgot password */}
              <div className="text-right">
                <span
                  className="text-sm text-text-muted cursor-not-allowed hover:text-text-secondary transition-colors"
                  title="Password reset coming soon"
                >
                  Forgot password?
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={`
                  w-full px-4 py-3 rounded-xl font-medium
                  bg-blade-blue text-void-deep border border-blade-blue
                  hover:shadow-[0_0_20px_rgba(0,112,243,0.4)]
                  active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                  flex items-center justify-center gap-2
                `}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.06]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-void-surface text-text-muted text-xs font-mono">
                  Don't have an account?
                </span>
              </div>
            </div>

            {/* Register link */}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className={`
                w-full px-4 py-3 rounded-xl font-medium
                bg-void-elevated/50 text-text-primary border border-white/[0.06]
                hover:border-white/10 hover:bg-void-elevated
                transition-all duration-200
                flex items-center justify-center gap-2
              `}
            >
              Create account
            </button>
          </div>
        </SpotlightCard>

        {/* Join with code */}
        <div className="mt-6 text-center">
          <p className="text-text-muted text-sm">
            Have an invite code?{' '}
            <Link
              to="/join"
              className="text-blade-blue hover:text-blade-blue/80 transition-colors font-medium"
            >
              Join a team
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
