import React, { useState } from 'react';
import { exportLineupToPDF } from '../../utils/pdfExport';

/**
 * Modal for PDF export options
 */
function PDFExportModal({ isOpen, onClose, lineupName, boats }) {
  const [layout, setLayout] = useState('compact');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      const fileName = await exportLineupToPDF({
        lineupName,
        boats,
        layout,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-card rounded-2xl p-6 w-full max-w-md mx-4 animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-2">📄</div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            Export to PDF
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Choose your layout preference
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          {/* Layout Options */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Layout Style
            </label>

            <button
              type="button"
              onClick={() => setLayout('compact')}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                layout === 'compact'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  layout === 'compact' ? 'border-blue-500' : 'border-gray-400'
                }`}>
                  {layout === 'compact' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-800 dark:text-gray-200">Compact</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Multiple boats per page, athletes in columns
                  </div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setLayout('detailed')}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                layout === 'detailed'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  layout === 'detailed' ? 'border-blue-500' : 'border-gray-400'
                }`}>
                  {layout === 'detailed' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-800 dark:text-gray-200">Detailed</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    One seat per line with full information
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Preview Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <div className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                {lineupName || 'Untitled Lineup'}
              </div>
              <div>{boats.length} boat{boats.length !== 1 ? 's' : ''}</div>
              <div>
                {boats.reduce((sum, boat) => {
                  return sum + boat.seats.filter(s => s.athlete).length + (boat.coxswain ? 1 : 0);
                }, 0)} athletes assigned
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting || boats.length === 0}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating PDF...
            </span>
          ) : (
            'Download PDF'
          )}
        </button>
      </div>
    </div>
  );
}

export default PDFExportModal;
