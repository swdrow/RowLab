import { useState, useRef } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import useLineupStore from '@/store/lineupStore';
import { PrintableLineup } from './PrintableLineup';
import { exportLineupToPdf } from '@v2/utils/lineupPdfExport';
import type { BoatInstance, SeatSlotData } from '@v2/types/lineup';

/**
 * Props for ExportPDFButton
 */
interface ExportPDFButtonProps {
  className?: string;
}

type ActiveBoatLike = {
  id: string | number;
  name?: string;
  boatConfig?: {
    name?: string;
    numSeats?: number;
    hasCoxswain?: boolean;
  };
  shellName?: string | null;
  shell?: {
    name?: string | null;
  };
  numSeats?: number;
  hasCoxswain?: boolean;
  seats?: Array<{
    seatNumber: number;
    side: string;
    athlete: BoatInstance['seats'][number]['athlete'] | null;
    isCoxswain?: boolean;
  }>;
  coxswain?: BoatInstance['coxswain'] | null;
  isExpanded?: boolean;
};

const normalizeSeatSide = (side?: string): SeatSlotData['side'] =>
  side === 'Port' || side === 'Starboard' ? side : 'Port';

export const mapBoatsForPrintableLineup = (boats: ActiveBoatLike[]): BoatInstance[] =>
  boats.map((boat) => {
    const boatConfig = boat.boatConfig;
    const seats =
      boat.seats
        ?.filter((seat) => !seat.isCoxswain)
        .map((seat) => ({
          seatNumber: seat.seatNumber,
          side: normalizeSeatSide(seat.side),
          athlete: seat.athlete ?? null,
        })) ?? [];
    const coxswainSeat = boat.seats?.find((seat) => seat.isCoxswain);

    return {
      id: String(boat.id),
      name: boat.name ?? boatConfig?.name ?? 'Boat',
      shellName: boat.shellName ?? boat.shell?.name ?? null,
      numSeats: boat.numSeats ?? boatConfig?.numSeats ?? seats.length,
      hasCoxswain: boat.hasCoxswain ?? boatConfig?.hasCoxswain ?? false,
      seats,
      coxswain: boat.coxswain ?? coxswainSeat?.athlete ?? null,
      isExpanded: boat.isExpanded ?? true,
    };
  });

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
export function ExportPDFButton({ className = '' }: ExportPDFButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showPrintable, setShowPrintable] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const activeBoats = useLineupStore((state) => state.activeBoats);
  const lineupName = useLineupStore((state) => state.lineupName || 'Lineup');
  const printableBoats = mapBoatsForPrintableLineup(activeBoats);

  const hasBoats = activeBoats.length > 0;

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
      await exportLineupToPdf(printRef.current, lineupName, { format: 'letter' });
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
        <span className="hidden md:inline">
          {isExporting ? 'Exporting...' : 'Export PDF'}
        </span>
      </button>

      {/* Hidden PrintableLineup container (portal to document.body) */}
      {showPrintable &&
        createPortal(
          <div ref={printRef}>
            <PrintableLineup boats={printableBoats} lineupName={lineupName} />
          </div>,
          document.body
        )}
    </>
  );
}

export default ExportPDFButton;
