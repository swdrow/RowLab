import React from 'react';
import ErgDataTable from './ErgDataTable';
import PerformanceChart from './PerformanceChart';

/**
 * SKELETON COMPONENT - Performance data view modal
 * Status: Awaiting erg testing data
 *
 * This component provides the UI structure for viewing athlete
 * performance data. Once erg_data.csv is populated, this will
 * display test results, trends, and comparisons.
 *
 * To activate:
 * 1. Populate /home/swd/RowLab/data/erg_data.csv with real data
 * 2. Load data in App.jsx using loadErgData()
 * 3. Pass ergData to this component
 * 4. Uncomment data visualization sections
 */
const PerformanceModal = ({ athlete, onClose, ergData = [] }) => {
  const athleteErgData = ergData.filter(
    d => d.lastName === athlete.lastName &&
         (d.firstName === athlete.firstName || !athlete.firstName)
  );

  const hasData = athleteErgData.length > 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-elevated rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Header */}
        <div className="sticky top-0 glass-card border-b border-white/10 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-blade-blue">
              {athlete.lastName}
              {athlete.firstName && `, ${athlete.firstName}`}
            </h2>
            <p className="text-sm text-text-secondary">Performance Data</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary hover:bg-white/10 rounded-full p-2 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!hasData ? (
            // Data pending message
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Performance Data Pending
              </h3>
              <p className="text-text-secondary mb-6 max-w-md mx-auto">
                Erg testing data will be displayed here once test results are imported.
                Import data by populating <code className="bg-void-elevated px-2 py-1 rounded text-sm">erg_data.csv</code>.
              </p>

              {/* Preview of what will be shown */}
              <div className="bg-blade-blue/10 border border-blade-blue/30 rounded-lg p-6 max-w-2xl mx-auto text-left">
                <h4 className="font-semibold text-blade-blue mb-3">
                  When data is available, you'll see:
                </h4>
                <ul className="space-y-2 text-sm text-blade-blue/80">
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Complete erg test history (2k, 6k, 500m, etc.)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Performance trends over time with charts</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Split times, stroke rates, and wattage data</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Comparison mode to evaluate multiple athletes side-by-side</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            // When data is available, show this
            <div className="space-y-6">
              <ErgDataTable data={athleteErgData} />
              <PerformanceChart data={athleteErgData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceModal;
