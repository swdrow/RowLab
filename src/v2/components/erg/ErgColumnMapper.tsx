import { ERG_TEST_COLUMNS, type ColumnMapping } from '@v2/utils/ergCsvParser';

interface ErgColumnMapperProps {
  csvHeaders: string[];
  mapping: ColumnMapping;
  onChange: (mapping: ColumnMapping) => void;
}

const columnLabels: Record<string, string> = {
  athleteName: 'Athlete Name',
  testType: 'Test Type',
  testDate: 'Test Date',
  timeSeconds: 'Time',
  distanceM: 'Distance (m)',
  splitSeconds: 'Split (500m)',
  watts: 'Watts',
  strokeRate: 'Stroke Rate',
  weightKg: 'Weight (kg)',
  notes: 'Notes',
};

const requiredColumns = ['athleteName', 'testType', 'testDate', 'timeSeconds'];

export function ErgColumnMapper({ csvHeaders, mapping, onChange }: ErgColumnMapperProps) {
  const handleChange = (target: string, source: string | null) => {
    onChange({ ...mapping, [target]: source || null });
  };

  const usedHeaders = new Set(Object.values(mapping).filter(Boolean));

  return (
    <div className="space-y-4">
      <p className="text-sm text-txt-secondary">
        Match your CSV columns to erg test fields. Required fields are marked with *.
      </p>

      <div className="space-y-3">
        {ERG_TEST_COLUMNS.map((target) => {
          const isRequired = requiredColumns.includes(target);
          const isMapped = mapping[target] !== null;

          return (
            <div
              key={target}
              className="flex items-center gap-4 p-3 bg-bg-surface-elevated rounded-lg"
            >
              <div className="w-40">
                <span className="text-sm font-medium text-txt-primary">
                  {columnLabels[target]}
                  {isRequired && <span className="text-status-error ml-1">*</span>}
                </span>
              </div>

              <div className="flex items-center gap-2 text-txt-tertiary">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>

              <select
                value={mapping[target] || ''}
                onChange={(e) => handleChange(target, e.target.value || null)}
                className={`
                  flex-1 px-3 py-2 bg-bg-surface border rounded-lg
                  text-txt-primary focus:outline-none focus:border-interactive-primary
                  ${isRequired && !isMapped ? 'border-status-error' : 'border-bdr-default'}
                `}
              >
                <option value="">— Not mapped —</option>
                {csvHeaders.map((header) => (
                  <option
                    key={header}
                    value={header}
                    disabled={usedHeaders.has(header) && mapping[target] !== header}
                  >
                    {header}
                    {usedHeaders.has(header) && mapping[target] !== header && ' (already used)'}
                  </option>
                ))}
              </select>

              {isMapped && (
                <span className="text-status-success text-sm">Mapped</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Unmapped headers info */}
      {csvHeaders.length > Object.values(mapping).filter(Boolean).length && (
        <div className="mt-4 p-3 bg-bg-surface rounded-lg">
          <p className="text-xs text-txt-tertiary">
            Unmapped columns from your CSV will be ignored:
            {' '}
            {csvHeaders
              .filter((h) => !usedHeaders.has(h))
              .join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
