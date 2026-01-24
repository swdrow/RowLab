import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { ValidationError, ValidatedAthleteData } from '@v2/utils/csvParser';

interface ImportPreviewProps {
  validRows: ValidatedAthleteData[];
  invalidRows: { row: number; errors: ValidationError[] }[];
  totalValid: number;
  totalInvalid: number;
}

export function ImportPreview({
  validRows,
  invalidRows,
  totalValid,
  totalInvalid,
}: ImportPreviewProps) {
  const hasErrors = totalInvalid > 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-lg">
          <CheckCircle2 size={18} />
          <span className="font-medium">{totalValid} valid</span>
        </div>
        {hasErrors && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg">
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
                className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg"
              >
                <div className="text-sm font-medium text-red-400">Row {row}</div>
                <ul className="mt-1 space-y-1">
                  {errors.map((error, i) => (
                    <li key={i} className="text-xs text-red-300">
                      <span className="font-medium">{error.column}:</span> {error.message}
                      {error.value !== null && error.value !== undefined && (
                        <span className="text-red-400/70"> (got: "{String(error.value)}")</span>
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
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Side</th>
                <th className="px-3 py-2 text-left">Height</th>
                <th className="px-3 py-2 text-left">Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bdr-subtle">
              {validRows.slice(0, 5).map((row, i) => (
                <tr key={i} className="text-txt-primary">
                  <td className="px-3 py-2">
                    {row.firstName} {row.lastName}
                  </td>
                  <td className="px-3 py-2 text-txt-secondary">
                    {row.email || '—'}
                  </td>
                  <td className="px-3 py-2">{row.side || '—'}</td>
                  <td className="px-3 py-2">
                    {row.heightCm ? `${row.heightCm} cm` : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {row.weightKg ? `${row.weightKg} kg` : '—'}
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
