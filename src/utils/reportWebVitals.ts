/**
 * Web Vitals reporting - DEV ONLY
 *
 * Logs Core Web Vitals metrics to the console during development.
 * Does NOT run in production builds (tree-shaken out by Vite).
 *
 * Metrics tracked:
 * - CLS: Cumulative Layout Shift
 * - INP: Interaction to Next Paint (replaces deprecated FID)
 * - FCP: First Contentful Paint
 * - LCP: Largest Contentful Paint
 * - TTFB: Time to First Byte
 */

export function reportWebVitals() {
  // Dev-only: import.meta.env.DEV is replaced with false in production
  // Vite tree-shakes this entire block out of production builds
  if (import.meta.env.DEV) {
    import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      const logMetric = (metric: { name: string; value: number; rating?: string }) => {
        const rating = metric.rating ? ` (${metric.rating})` : '';
        console.log(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}ms${rating}`);
      };

      onCLS(logMetric);
      onINP(logMetric);
      onFCP(logMetric);
      onLCP(logMetric);
      onTTFB(logMetric);
    });
  }
}
