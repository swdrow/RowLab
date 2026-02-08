/**
 * @deprecated V1 Legacy — replaced by V2/V3 erg data components.
 * See: src/v2/pages/ErgTestsPage.tsx, src/v2/components/erg/ErgTestsTable.tsx
 * Removal planned: Phase 36 (V1/V2 Cleanup)
 */
import React from 'react';

/**
 * SKELETON COMPONENT - Erg test results table
 * Status: Ready for data integration
 *
 * Displays tabular erg testing data once available
 */
const ErgDataTable = ({ data }) => {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-lg font-display font-semibold mb-3 tracking-[-0.02em]">Test Results</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/[0.06] border border-white/[0.06] rounded-lg">
          <thead className="bg-void-surface">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-mono font-medium text-text-muted uppercase tracking-widest">
                Date
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-mono font-medium text-text-muted uppercase tracking-widest">
                Test Type
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-mono font-medium text-text-muted uppercase tracking-widest">
                Result
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-mono font-medium text-text-muted uppercase tracking-widest">
                Split
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-mono font-medium text-text-muted uppercase tracking-widest">
                Stroke Rate
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-mono font-medium text-text-muted uppercase tracking-widest">
                Watts
              </th>
            </tr>
          </thead>
          <tbody className="bg-void-elevated divide-y divide-white/[0.06]">
            {data.map((test, index) => (
              <tr key={index} className="hover:bg-void-surface">
                <td className="px-4 py-3 text-sm font-mono tabular-nums text-text-primary">
                  {test.date}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-text-primary">{test.testType}</td>
                <td className="px-4 py-3 text-sm font-mono tabular-nums text-text-primary font-semibold">
                  {test.result}
                </td>
                <td className="px-4 py-3 text-sm font-mono tabular-nums text-text-secondary">
                  {test.split}
                </td>
                <td className="px-4 py-3 text-sm font-mono tabular-nums text-text-secondary">
                  {test.strokeRate}
                </td>
                <td className="px-4 py-3 text-sm font-mono tabular-nums text-text-secondary">
                  {test.watts}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ErgDataTable;
