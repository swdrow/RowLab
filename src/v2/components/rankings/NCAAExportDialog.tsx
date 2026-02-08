import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Download, X, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { MODAL_VARIANTS } from '../../utils/animations';

export type Ranking = {
  teamName: string;
  boatClass: string;
  rank: number;
  adjustedSpeed: number | null;
  sampleCount: number;
  lastCalculatedAt: string;
};

export type NCAAExportDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  rankings: Ranking[];
};

/**
 * Dialog for exporting rankings in NCAA-compliant CSV format
 * Per RESEARCH.md Pattern 5: CSV export with required headers
 */
export function NCAAExportDialog({ isOpen, onClose, rankings }: NCAAExportDialogProps) {
  const handleExport = () => {
    if (!rankings || rankings.length === 0) {
      toast.error('No rankings to export');
      return;
    }

    try {
      // Generate CSV content with NCAA-compliant headers
      const headers = [
        'Institution',
        'Boat Class',
        'Rank',
        'Speed (m/s)',
        'Sample Size',
        'Last Updated',
      ];

      const rows = rankings.map((r) => [
        r.teamName,
        r.boatClass,
        r.rank.toString(),
        r.adjustedSpeed !== null ? r.adjustedSpeed.toFixed(3) : 'N/A',
        r.sampleCount.toString(),
        format(new Date(r.lastCalculatedAt), 'yyyy-MM-dd'),
      ]);

      const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

      // Create Blob and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ncaa-rankings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Rankings exported successfully');
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export rankings');
    }
  };

  // Get date range for preview
  const dateRange =
    rankings.length > 0
      ? {
          earliest: new Date(
            Math.min(...rankings.map((r) => new Date(r.lastCalculatedAt).getTime()))
          ),
          latest: new Date(
            Math.max(...rankings.map((r) => new Date(r.lastCalculatedAt).getTime()))
          ),
        }
      : null;

  // Get unique boat classes
  const boatClasses = [...new Set(rankings.map((r) => r.boatClass))].join(', ');

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-ink-deep/80 backdrop-blur-sm" />
        </Transition.Child>

        {/* Dialog panel */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel
              as={motion.div}
              variants={MODAL_VARIANTS}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md bg-ink-well rounded-xl shadow-2xl border border-ink-border overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-ink-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-copper/10 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-accent-copper" />
                  </div>
                  <Dialog.Title className="text-lg font-semibold text-txt-primary">
                    Export for NCAA
                  </Dialog.Title>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-txt-tertiary hover:bg-ink-hover transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4 space-y-4">
                <p className="text-sm text-txt-secondary">
                  Export rankings in NCAA-compliant CSV format for submission to governing bodies.
                </p>

                {/* Preview info */}
                <div className="bg-ink-raised rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-txt-tertiary">Teams:</span>
                    <span className="text-txt-primary font-medium">{rankings.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-txt-tertiary">Boat Classes:</span>
                    <span className="text-txt-primary font-medium">{boatClasses || 'N/A'}</span>
                  </div>
                  {dateRange && (
                    <div className="flex justify-between text-sm">
                      <span className="text-txt-tertiary">Date Range:</span>
                      <span className="text-txt-primary font-medium">
                        {format(dateRange.earliest, 'MMM d')} -{' '}
                        {format(dateRange.latest, 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Format info */}
                <div className="text-xs text-txt-tertiary space-y-1">
                  <p className="font-medium">CSV will include:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li>Institution name</li>
                    <li>Boat class</li>
                    <li>Current rank</li>
                    <li>Speed estimate (m/s)</li>
                    <li>Sample size (race count)</li>
                    <li>Last updated date</li>
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-ink-border bg-ink-raised">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-txt-secondary
                           bg-ink-well rounded-lg hover:bg-ink-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={rankings.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white
                           bg-accent-copper rounded-lg hover:bg-accent-copper-hover
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
