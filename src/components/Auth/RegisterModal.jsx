import React, { useState } from 'react';

/**
 * Register Modal Component
 * For users to submit account applications
 */
function RegisterModal({ isOpen, onClose, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    email: '',
    requestMessage: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          name: formData.name,
          email: formData.email || undefined,
          requestMessage: formData.requestMessage || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
      name: '',
      email: '',
      requestMessage: '',
    });
    setError(null);
    setSuccess(false);
    onClose();
  };

  // Success view
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />
        <div className="relative glass-card rounded-2xl p-8 w-full max-w-md mx-4 animate-slide-up">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Application Submitted!
            </h2>
            <p className="text-text-secondary mb-6">
              Your account request has been submitted and is pending approval.
              You'll be able to log in once an administrator approves your application.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-blade-blue hover:bg-blade-blue/90 text-void-deep font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blade-blue/20"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative glass-card rounded-2xl p-8 w-full max-w-md mx-4 animate-slide-up max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-2">📝</div>
          <h2 className="text-2xl font-bold text-text-primary">
            Request Access
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Submit your application to become a coach
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-void-elevated/50 text-text-primary focus:ring-2 focus:ring-blade-blue/50 focus:border-blade-blue/30 outline-none transition"
              placeholder="Your full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Username *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-void-elevated/50 text-text-primary focus:ring-2 focus:ring-blade-blue/50 focus:border-blade-blue/30 outline-none transition"
              placeholder="Choose a username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-void-elevated/50 text-text-primary focus:ring-2 focus:ring-blade-blue/50 focus:border-blade-blue/30 outline-none transition"
              placeholder="your@email.com (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-void-elevated/50 text-text-primary focus:ring-2 focus:ring-blade-blue/50 focus:border-blade-blue/30 outline-none transition"
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-void-elevated/50 text-text-primary focus:ring-2 focus:ring-blade-blue/50 focus:border-blade-blue/30 outline-none transition"
              placeholder="Confirm your password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Why do you want to join?
            </label>
            <textarea
              name="requestMessage"
              value={formData.requestMessage}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-void-elevated/50 text-text-primary focus:ring-2 focus:ring-blade-blue/50 focus:border-blade-blue/30 outline-none transition resize-none"
              placeholder="Tell us about yourself (optional)"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blade-blue hover:bg-blade-blue/90 text-void-deep font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blade-blue/20"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit Application'
            )}
          </button>
        </form>

        <p className="text-sm text-center text-text-muted mt-6">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-blade-blue hover:underline font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

export default RegisterModal;
