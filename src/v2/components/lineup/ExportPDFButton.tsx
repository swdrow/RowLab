import { useState, useRef } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { PrintableLineup } from './PrintableLineup';
import { exportLineupToPdf } from '@v2/utils/lineupPdfExport';
/**
 * Props for ExportPDFButton
 */
interface ExportPDFButtonProps {
  boats: any[]; // Accepts ActiveBoat[] or BoatInstance[] — both have seats, name, etc.
  lineupName?: string;
  className?: string;
}

/**
 * ExportPDFButton - Trigger PDF export with loading state
 *
 * Features:
 * - Renders PrintableLineup off-screen in hidden container
 * - Waits for render complete (uses setTimeout to ensure DOM update)
 * - Calls exportLineupToPdf with rendered element
 * - Shows loading spinner during generation
 * - Disabled when no boats in workspace
 * - Error handling with console error (toast could be added later)
 *
 * Per LINE-11: "export lineup as print-ready PDF (high-contrast, large font)"
 *
 * Process:
 * 1. Click button
 * 2. Render PrintableLineup to hidden DOM container
 * 3. Wait for render (setTimeout 100ms)
 * 4. Capture with html2canvas via exportLineupToPdf
 * 5. Generate and download PDF
 * 6. Clean up (hidden container removed by React)
 */
export function ExportPDFButton({
  boats,
  lineupName = 'Lineup',
  className = '',
}: ExportPDFButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showPrintable, setShowPrintable] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const hasBoats = boats.length > 0;

  const handleExport = async () => {
    if (!hasBoats || isExporting) return;

    setIsExporting(true);
    setShowPrintable(true);

    try {
      // Wait for PrintableLineup to render in DOM
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!printRef.current) {
        throw new Error('PrintableLineup element not found');
      }

      // Export to PDF
      await exportLineupToPdf(printRef.current, lineupName);
    } catch (error) {
      console.error('PDF export failed:', error);
      // TODO: Show error toast when toast system is integrated
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
      setShowPrintable(false);
    }
  };

  return (
    <>
      <button
        onClick={handleExport}
        disabled={!hasBoats || isExporting}
        className={`
          inline-flex items-center gap-2 px-3 py-2 rounded-lg
          text-sm font-medium
          transition-all duration-150
          ${
            hasBoats && !isExporting
              ? 'bg-bg-surface hover:bg-bg-hover text-txt-primary border border-bdr-default hover:border-bdr-hover'
              : 'bg-bg-surface text-txt-disabled border border-bdr-default cursor-not-allowed opacity-50'
          }
          ${className}
        `}
        title={
          !hasBoats
            ? 'Add boats to export lineup'
            : isExporting
              ? 'Generating PDF...'
              : 'Export lineup as PDF'
        }
        aria-label="Export PDF"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileDown className="w-4 h-4" />
        )}
        <span className="hidden md:inline">{isExporting ? 'Exporting...' : 'Export PDF'}</span>
      </button>

      {/* Hidden PrintableLineup container (portal to document.body) */}
      {showPrintable &&
        createPortal(
          <div ref={printRef}>
            <PrintableLineup boats={boats} lineupName={lineupName} />
          </div>,
          document.body
        )}
    </>
  );
}

export default ExportPDFButton;
