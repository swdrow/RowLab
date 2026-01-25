// src/v2/components/training/compliance/NCAAAuditReport.tsx

import React, { useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { useNcaaComplianceReport } from '../../../hooks/useNcaaCompliance';
import { NCAA_WEEKLY_LIMIT, NCAA_DAILY_LIMIT, NCAA_COMPETITION_HOURS } from '../../../utils/ncaaRules';
import type { NCAAAuditEntry, PracticeSession, ActivityType } from '../../../types/training';

interface NCAAAuditReportProps {
  weekStart: Date;
  teamName?: string;
  onClose?: () => void;
  className?: string;
}

const activityTypeLabels: Record<ActivityType, string> = {
  practice: 'Practice',
  competition: 'Competition',
  strength: 'Strength Training',
  film: 'Film Session',
  voluntary: 'Voluntary',
};

/**
 * Printable NCAA compliance audit report.
 * Shows detailed breakdown of all countable activities for each athlete.
 */
export function NCAAAuditReport({
  weekStart,
  teamName = 'Team',
  onClose,
  className = '',
}: NCAAAuditReportProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { report, isLoading, error } = useNcaaComplianceReport(weekStart);

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>NCAA Compliance Report - ${format(weekStart, 'MMM d, yyyy')}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 2rem; }
              table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
              th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; font-size: 0.875rem; }
              th { background: #f5f5f5; font-weight: 600; }
              .header { margin-bottom: 1.5rem; }
              .header h1 { margin: 0 0 0.5rem 0; font-size: 1.5rem; }
              .header p { margin: 0; color: #666; }
              .summary { background: #f9f9f9; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem; }
              .over-limit { color: #dc2626; font-weight: 600; }
              .near-limit { color: #d97706; }
              .section { margin-bottom: 2rem; page-break-inside: avoid; }
              .section h2 { font-size: 1.125rem; margin: 0 0 0.5rem 0; padding-bottom: 0.5rem; border-bottom: 2px solid #333; }
              .athlete-name { font-weight: 600; }
              .activity-type { display: inline-block; padding: 0.125rem 0.5rem; background: #e5e7eb; border-radius: 0.25rem; font-size: 0.75rem; }
              .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ddd; font-size: 0.75rem; color: #666; }
              @media print {
                body { margin: 1rem; }
                .section { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            ${printRef.current.innerHTML}
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="text-center py-8 text-txt-tertiary">
        Failed to generate compliance report
      </div>
    );
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <div className={`ncaa-audit-report ${className}`}>
      {/* Actions Bar */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h2 className="text-lg font-semibold text-txt-primary">NCAA Compliance Report</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                       bg-accent-primary text-white rounded-md
                       hover:bg-accent-primary-hover transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Report
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-txt-secondary
                         hover:text-txt-primary transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Printable Content */}
      <div ref={printRef} className="bg-white text-gray-900 p-6 rounded-lg border border-bdr-default print:border-0">
        {/* Header */}
        <div className="header mb-6">
          <h1 className="text-xl font-bold">NCAA 20-Hour Rule Compliance Report</h1>
          <p className="text-gray-600">{teamName}</p>
          <p className="text-gray-600">
            Week of {format(weekStart, 'MMMM d, yyyy')} - {format(weekEnd, 'MMMM d, yyyy')}
          </p>
        </div>

        {/* Summary */}
        <div className="summary bg-gray-50 p-4 rounded-lg mb-6">
          <h2 className="font-semibold mb-2">Summary</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Total Athletes</div>
              <div className="text-lg font-semibold">{report.entries.length}</div>
            </div>
            <div>
              <div className="text-gray-500">Near Limit (18-20h)</div>
              <div className={`text-lg font-semibold ${report.athletesNearLimit > 0 ? 'text-amber-600' : ''}`}>
                {report.athletesNearLimit}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Over Limit (&gt;20h)</div>
              <div className={`text-lg font-semibold ${report.athletesOverLimit > 0 ? 'text-red-600' : ''}`}>
                {report.athletesOverLimit}
              </div>
            </div>
          </div>
        </div>

        {/* NCAA Rules Reference */}
        <div className="text-xs text-gray-500 mb-6 p-3 bg-gray-50 rounded">
          <strong>NCAA Rules Reference:</strong>
          <ul className="mt-1 space-y-0.5">
            <li>Weekly maximum: {NCAA_WEEKLY_LIMIT} hours of CARA (Countable Athletically Related Activities)</li>
            <li>Daily maximum: {NCAA_DAILY_LIMIT} hours per day</li>
            <li>Competitions: Count as {NCAA_COMPETITION_HOURS} hours regardless of actual duration</li>
          </ul>
        </div>

        {/* Athlete Details */}
        {report.entries.map((entry) => (
          <div key={entry.athleteId} className="section mb-6">
            <h2 className="text-base font-semibold border-b-2 border-gray-300 pb-1 mb-3 flex items-center justify-between">
              <span className="athlete-name">{entry.athleteName}</span>
              <span className={`text-sm ${
                entry.isOverLimit ? 'text-red-600' :
                entry.isNearLimit ? 'text-amber-600' : 'text-green-600'
              }`}>
                {entry.weeklyTotal.toFixed(1)}h / {NCAA_WEEKLY_LIMIT}h
              </span>
            </h2>

            {entry.sessions.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No countable activities recorded</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Activity Type</th>
                    <th>Duration</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.sessions
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((session, idx) => (
                      <tr key={idx}>
                        <td>{format(parseISO(session.date), 'EEE, MMM d')}</td>
                        <td>
                          <span className="activity-type">
                            {activityTypeLabels[session.activityType]}
                          </span>
                        </td>
                        <td>
                          {session.isCompetition
                            ? `${NCAA_COMPETITION_HOURS}h (competition)`
                            : `${(session.durationMinutes / 60).toFixed(1)}h`}
                        </td>
                        <td className="text-gray-500">{session.notes || '-'}</td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <td colSpan={2}>Week Total</td>
                    <td className={entry.isOverLimit ? 'text-red-600' : ''}>
                      {entry.weeklyTotal.toFixed(1)}h
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        ))}

        {/* Footer */}
        <div className="footer mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500">
          <p>
            Report generated: {format(parseISO(report.generatedAt), 'MMMM d, yyyy \'at\' h:mm a')}
          </p>
          <p className="mt-1">
            This report is for internal compliance tracking purposes. Retain for NCAA audit requirements.
          </p>
        </div>
      </div>
    </div>
  );
}

export default NCAAAuditReport;
