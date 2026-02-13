/**
 * CanvasErrorBoundary - Error boundary with Canvas design language
 *
 * Catches React component crashes and shows a recovery UI instead of blank page.
 * Styled with Canvas tokens: ink-bright, ink-muted, chamfered corners.
 *
 * Usage:
 * <CanvasErrorBoundary>
 *   <YourComponent />
 * </CanvasErrorBoundary>
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from '@phosphor-icons/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CanvasErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="max-w-md space-y-6">
            {/* Icon + Header */}
            <div className="flex items-center gap-3">
              <div
                className="p-3 border border-white/[0.12] bg-ink-raised"
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
                }}
              >
                <AlertTriangle className="w-6 h-6 text-data-warning" weight="fill" />
              </div>
              <h2 className="text-xl font-semibold text-ink-bright tracking-tight">
                Something went wrong
              </h2>
            </div>

            {/* Error message */}
            <div className="space-y-2">
              <p className="text-sm text-ink-muted leading-relaxed">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                <pre className="text-xs font-mono text-ink-secondary bg-ink-deep/50 p-3 border border-white/[0.06] overflow-auto max-h-32">
                  {this.state.error.stack}
                </pre>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={this.handleReset}
                className="px-4 py-2.5 text-sm font-medium text-ink-bright border border-white/[0.12] hover:bg-ink-raised transition-colors"
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)',
                }}
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2.5 text-sm font-medium text-ink-muted hover:text-ink-bright transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default CanvasErrorBoundary;
