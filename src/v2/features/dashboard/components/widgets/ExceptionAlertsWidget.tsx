import { Link } from 'react-router-dom';
import { Warning, CheckCircle } from '@phosphor-icons/react';
import { useExceptions, getExceptionColor } from '../../hooks/useExceptions';
import { useAuth } from '../../../../contexts/AuthContext';
import type { WidgetProps } from '../../types';

export function ExceptionAlertsWidget(_props: WidgetProps) {
  const { activeTeamId } = useAuth();
  const { summary, isLoading } = useExceptions(activeTeamId || '');

  const alertItems = summary.items.filter(
    (item) => item.severity === 'critical' || item.severity === 'warning'
  );
  const isAllClear = alertItems.length === 0 && summary.ok > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-ink-bright flex items-center gap-2">
          <Warning className="w-5 h-5 text-accent-copper" />
          Exception Alerts
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-ink-base rounded-lg animate-pulse" />
            ))}
          </div>
        ) : isAllClear ? (
          <div className="text-center py-8 text-status-success">
            <CheckCircle className="w-8 h-8 mx-auto mb-2" weight="fill" />
            <p className="font-medium">All Clear</p>
            <p className="text-sm text-ink-muted mt-1">No exceptions detected</p>
          </div>
        ) : alertItems.length === 0 ? (
          <div className="text-center py-8 text-ink-muted">
            <Warning className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No alert data available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alertItems.map((item) => {
              const colors = getExceptionColor(item.severity);

              const content = (
                <div
                  className="flex items-start gap-3 p-3 rounded-lg bg-ink-base
                    border border-white/[0.06] hover:border-white/[0.12] transition-colors group"
                >
                  <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${colors.bg}`} />
                  <div className="min-w-0">
                    <div className={`font-medium text-sm ${colors.text}`}>{item.title}</div>
                    <div className="text-xs text-ink-muted mt-0.5">{item.description}</div>
                    {item.actionLabel && (
                      <span className="text-xs text-accent-copper mt-1 inline-block">
                        {item.actionLabel}
                      </span>
                    )}
                  </div>
                </div>
              );

              if (item.actionPath) {
                return (
                  <Link key={item.id} to={item.actionPath}>
                    {content}
                  </Link>
                );
              }

              return <div key={item.id}>{content}</div>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
