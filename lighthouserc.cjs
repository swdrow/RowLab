/**
 * Lighthouse CI Configuration
 *
 * Runs Lighthouse performance audits against the built app to prevent
 * performance regressions. Configured with Core Web Vitals thresholds.
 *
 * Usage:
 *   npm run build && npm run lhci
 *
 * Assertions:
 * - LCP (Largest Contentful Paint) < 2.5s
 * - CLS (Cumulative Layout Shift) < 0.1
 * - FCP (First Contentful Paint) < 1.8s
 * - TTI (Time to Interactive) < 3.9s
 * - TBT (Total Blocking Time) < 300ms
 * - Performance score >= 80%
 * - Accessibility score >= 90%
 */

module.exports = {
  ci: {
    collect: {
      // Run against local build output
      staticDistDir: './dist',

      // Number of runs for consistency (median values)
      numberOfRuns: 3,

      settings: {
        // Use desktop preset for primary testing
        // Mobile responsiveness is tested separately in Phase 35
        preset: 'desktop',

        // Simulate throttling for realistic conditions
        throttlingMethod: 'simulate',

        // Which URL to test (index.html in dist)
        url: ['http://localhost/'],
      },
    },

    assert: {
      assertions: {
        // ============================================
        // CORE WEB VITALS (error level)
        // ============================================

        // Largest Contentful Paint - Critical UX metric
        // Good: < 2.5s | Needs Improvement: 2.5-4s | Poor: > 4s
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],

        // Cumulative Layout Shift - Visual stability
        // Good: < 0.1 | Needs Improvement: 0.1-0.25 | Poor: > 0.25
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],

        // ============================================
        // ADDITIONAL PERFORMANCE METRICS (warn level)
        // ============================================

        // First Contentful Paint - Perceived load speed
        // Good: < 1.8s | Needs Improvement: 1.8-3s | Poor: > 3s
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],

        // Time to Interactive - When page becomes fully interactive
        // Good: < 3.9s | Needs Improvement: 3.9-7.3s | Poor: > 7.3s
        interactive: ['warn', { maxNumericValue: 3900 }],

        // Total Blocking Time - Main thread blocking
        // Good: < 300ms | Needs Improvement: 300-600ms | Poor: > 600ms
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],

        // ============================================
        // LIGHTHOUSE SCORES (warn level)
        // ============================================

        // Performance score (0-1 scale, 1 = 100%)
        'categories:performance': ['warn', { minScore: 0.8 }],

        // Accessibility score (complementing jest-axe)
        'categories:accessibility': ['warn', { minScore: 0.9 }],

        // TODO(phase-36): Add SEO and Best Practices assertions after baseline
        // 'categories:seo': ['warn', { minScore: 0.9 }],
        // 'categories:best-practices': ['warn', { minScore: 0.9 }],
      },
    },

    upload: {
      // Store results in temporary public storage
      // For CI integration, configure LHCI server or GitHub Actions upload
      target: 'temporary-public-storage',
    },
  },
};
