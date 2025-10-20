import React, { useState } from 'react';
import {
  GlassCard,
  GlassButton,
  GlassModal,
  GlassInput,
  GlassBadge,
  GlassContainer,
  GlassNavbar,
} from './index';

/**
 * Liquid Glass Design System Showcase
 *
 * This component demonstrates all Glass components in action.
 * Use this as a reference for implementing the Liquid Glass aesthetic.
 *
 * To view: Import this component in App.jsx
 */

function ShowcaseExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsModalOpen(false);
    }, 2000);
  };

  return (
    <GlassContainer variant="mesh">
      <div className="min-h-screen">
        {/* Navigation */}
        <GlassNavbar
          title="Liquid Glass Showcase"
          leftContent={
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-blue-violet animate-glow-pulse" />
              <GlassBadge variant="info" size="sm">
                Demo
              </GlassBadge>
            </div>
          }
          rightContent={
            <div className="flex items-center gap-3">
              <GlassBadge variant="success" dot>
                Ready
              </GlassBadge>
            </div>
          }
          sticky
          blur="strong"
        />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Liquid Glass Design System
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Inspired by Apple iOS 26 - Translucent, fluid, and elegant
            </p>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Card Variants */}
            <GlassCard variant="base" className="p-6 animate-slide-up">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Card Variants
              </h2>
              <div className="space-y-3">
                <GlassCard variant="subtle" className="p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong>Subtle:</strong> Minimal depth, perfect for nested elements
                  </p>
                </GlassCard>

                <GlassCard variant="base" className="p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong>Base:</strong> Standard cards with balanced translucency
                  </p>
                </GlassCard>

                <GlassCard variant="elevated" className="p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong>Elevated:</strong> Interactive elements with stronger glass
                  </p>
                </GlassCard>

                <GlassCard variant="strong" className="p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong>Strong:</strong> Modals and important overlays
                  </p>
                </GlassCard>
              </div>
            </GlassCard>

            {/* Button Variants */}
            <GlassCard variant="base" className="p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Button Variants
              </h2>
              <div className="space-y-3">
                <GlassButton variant="primary" size="md" fullWidth>
                  Primary Action
                </GlassButton>

                <GlassButton variant="secondary" size="md" fullWidth>
                  Secondary Action
                </GlassButton>

                <GlassButton variant="ghost" size="md" fullWidth>
                  Ghost Button
                </GlassButton>

                <GlassButton variant="danger" size="md" fullWidth>
                  Danger Action
                </GlassButton>

                <GlassButton
                  variant="primary"
                  size="sm"
                  loading={isLoading}
                  onClick={() => setIsLoading(!isLoading)}
                >
                  Toggle Loading
                </GlassButton>
              </div>
            </GlassCard>

            {/* Badge Collection */}
            <GlassCard variant="base" className="p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Status Badges
              </h2>
              <div className="flex flex-wrap gap-2">
                <GlassBadge variant="primary">Primary</GlassBadge>
                <GlassBadge variant="secondary">Secondary</GlassBadge>
                <GlassBadge variant="success" dot>Success</GlassBadge>
                <GlassBadge variant="warning">Warning</GlassBadge>
                <GlassBadge variant="error">Error</GlassBadge>
                <GlassBadge variant="info">Info</GlassBadge>
                <GlassBadge variant="port" glow>Port</GlassBadge>
                <GlassBadge variant="starboard" glow>Starboard</GlassBadge>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 dark:border-white/5">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Size Variants
                </h3>
                <div className="flex flex-wrap gap-2 items-center">
                  <GlassBadge variant="primary" size="sm">Small</GlassBadge>
                  <GlassBadge variant="primary" size="md">Medium</GlassBadge>
                  <GlassBadge variant="primary" size="lg">Large</GlassBadge>
                </div>
              </div>
            </GlassCard>

            {/* Form Inputs */}
            <GlassCard variant="base" className="p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Form Inputs
              </h2>
              <div className="space-y-4">
                <GlassInput
                  label="Name"
                  placeholder="Enter your name"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  helperText="This is a helper text"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                />

                <GlassInput
                  label="Email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                />

                <GlassInput
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  error="Password must be at least 8 characters"
                />
              </div>
            </GlassCard>

            {/* Interactive Cards */}
            <GlassCard variant="elevated" className="p-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Interactive Elements
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <GlassCard
                  variant="subtle"
                  interactive
                  glow
                  className="p-4 text-center cursor-pointer"
                >
                  <div className="text-3xl mb-2">🚣</div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    8+
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Eight with Cox
                  </p>
                </GlassCard>

                <GlassCard
                  variant="subtle"
                  interactive
                  glow
                  className="p-4 text-center cursor-pointer"
                >
                  <div className="text-3xl mb-2">🚣</div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    4-
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Coxless Four
                  </p>
                </GlassCard>

                <GlassCard
                  variant="subtle"
                  interactive
                  glow
                  className="p-4 text-center cursor-pointer"
                >
                  <div className="text-3xl mb-2">🚣</div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    2x
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Double Scull
                  </p>
                </GlassCard>

                <GlassCard
                  variant="subtle"
                  interactive
                  glow
                  className="p-4 text-center cursor-pointer"
                >
                  <div className="text-3xl mb-2">🚣</div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    1x
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Single Scull
                  </p>
                </GlassCard>
              </div>
            </GlassCard>

            {/* Modal Trigger */}
            <GlassCard variant="base" className="p-6 animate-slide-up" style={{ animationDelay: '500ms' }}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Modal Component
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Click the button below to see the Liquid Glass modal with ultra-blur backdrop.
              </p>
              <GlassButton
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => setIsModalOpen(true)}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
              >
                Open Modal
              </GlassButton>
            </GlassCard>
          </div>

          {/* Full-width Example */}
          <GlassCard variant="elevated" className="p-8 text-center animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Ready to Transform Your App?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              The Liquid Glass design system is ready to use. Check out{' '}
              <code className="px-2 py-1 bg-white/30 dark:bg-white/10 rounded text-sm">
                IMPLEMENTATION_EXAMPLES.md
              </code>{' '}
              to see how to transform your existing components.
            </p>
            <div className="flex gap-3 justify-center">
              <GlassButton variant="primary" size="lg">
                Get Started
              </GlassButton>
              <GlassButton variant="secondary" size="lg">
                View Docs
              </GlassButton>
            </div>
          </GlassCard>
        </main>

        {/* Modal */}
        <GlassModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Glass Modal Example"
          size="md"
          showCloseButton
          closeOnBackdrop
          closeOnEscape
        >
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              This modal demonstrates the Liquid Glass aesthetic with:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 text-sm">
              <li>Ultra-blurred backdrop (40px blur)</li>
              <li>Floating glass panel with depth shadows</li>
              <li>Smooth scale-in animation</li>
              <li>ESC key and backdrop click to close</li>
              <li>Scroll lock on body</li>
            </ul>

            <GlassInput
              label="Example Input"
              placeholder="Try typing something"
              helperText="Inputs work seamlessly in modals"
            />

            <div className="flex gap-3 mt-6">
              <GlassButton
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
                fullWidth
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={handleSubmit}
                loading={isLoading}
                fullWidth
              >
                Confirm
              </GlassButton>
            </div>
          </div>
        </GlassModal>
      </div>
    </GlassContainer>
  );
}

export default ShowcaseExample;
