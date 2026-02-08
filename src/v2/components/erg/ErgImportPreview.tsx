import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { ValidationError, ValidatedErgTestData } from '@v2/utils/ergCsvParser';

interface ErgImportPreviewProps {
  validRows: ValidatedErgTestData[];
  invalidRows: { row: number; errors: ValidationError[] }[];
  totalValid: number;
  totalInvalid: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins}:${secs.padStart(4, '0')}`;
}

export function ErgImportPreview({
  validRows,
  invalidRows,
  totalValid,
  totalInvalid,
}: ErgImportPreviewProps) {
  const hasErrors = totalInvalid > 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-data-excellent/10 text-data-excellent rounded-lg">
          <CheckCircle2 size={18} />
          <span className="font-medium">{totalValid} valid</span>
        </div>
        {hasErrors && (
          <div className="flex items-center gap-2 px-4 py-2 bg-status-error/10 text-status-error rounded-lg">
            <AlertCircle size={18} />
            <span className="font-medium">{totalInvalid} with errors</span>
          </div>
        )}
      </div>

      {/* Errors section */}
      {hasErrors && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-txt-primary">Rows with errors:</h4>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {invalidRows.slice(0, 20).map(({ row, errors }) => (
              <div
                key={row}
                className="p-3 bg-status-error/5 border border-status-error/20 rounded-lg"
              >
                <div className="text-sm font-medium text-status-error">Row {row}</div>
                <ul className="mt-1 space-y-1">
                  {errors.map((error, i) => (
                    <li key={i} className="text-xs text-status-error/80">
                      <span className="font-medium">{error.column}:</span> {error.message}
                      {error.value !== null && error.value !== undefined && (
                        <span className="text-status-error/60">
                          {' '}
                          (got: "{String(error.value)}")
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {invalidRows.length > 20 && (
              <p className="text-xs text-txt-tertiary">
                And {invalidRows.length - 20} more rows with errors...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Valid rows preview */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-txt-primary">
          Preview ({Math.min(5, validRows.length)} of {totalValid} valid rows):
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-txt-secondary text-xs uppercase">
                <th className="px-3 py-2 text-left">Athlete</th>
                <th className="px-3 py-2 text-left">Test Type</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Time</th>
                <th className="px-3 py-2 text-left">Split</th>
                <th className="px-3 py-2 text-left">Watts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bdr-subtle">
              {validRows.slice(0, 5).map((row, i) => (
                <tr key={i} className="text-txt-primary">
                  <td className="px-3 py-2 text-txt-secondary">
                    Athlete ID: {row.athleteId.substring(0, 8)}...
                  </td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 bg-interactive-primary/10 text-interactive-primary rounded font-medium">
                      {row.testType}
                    </span>
                  </td>
                  <td className="px-3 py-2">{row.testDate}</td>
                  <td className="px-3 py-2 font-mono">{formatTime(row.timeSeconds)}</td>
                  <td className="px-3 py-2 font-mono text-txt-secondary">
                    {row.splitSeconds ? formatTime(row.splitSeconds) : '—'}
                  </td>
                  <td className="px-3 py-2 text-txt-secondary">
                    {row.watts ? `${row.watts}W` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
