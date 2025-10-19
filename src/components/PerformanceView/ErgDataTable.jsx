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
      <h3 className="text-lg font-semibold mb-3">Test Results</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Test Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Result
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Split
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Stroke Rate
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Watts
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((test, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">
                  {test.date}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {test.testType}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 font-semibold">
                  {test.result}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {test.split}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {test.strokeRate}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
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
