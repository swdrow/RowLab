import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Export lineup to PDF using html2canvas + jsPDF
 *
 * Captures HTML element as canvas, converts to PDF with proper dimensions.
 * Handles US Letter (default) and A4 formats.
 *
 * Features:
 * - High-quality capture (scale: 2)
 * - Proper dimension calculation (per RESEARCH.md Pitfall 4)
 * - Single-page layout with margins
 * - Automatic download with filename
 * - PDF metadata (title, creation date)
 *
 * Per RESEARCH.md: "html2canvas captures at actual pixel dimensions, jsPDF expects specific units"
 *
 * @param element - HTML element to capture (usually PrintableLineup)
 * @param lineupName - Name for PDF filename and metadata
 * @param options - Optional configuration
 */

export interface ExportPdfOptions {
  /** Canvas scale factor (default: 2 for high quality) */
  scale?: number;
  /** Paper format (default: 'letter' for US standard) */
  format?: 'a4' | 'letter';
}

export async function exportLineupToPdf(
  element: HTMLElement,
  lineupName: string,
  options: ExportPdfOptions = {}
): Promise<void> {
  const { scale = 2, format = 'letter' } = options;

  try {
    // Step 1: Capture HTML as canvas with html2canvas
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    // Step 2: Convert canvas to image data
    const imgData = canvas.toDataURL('image/png', 1.0);

    // Step 3: Create PDF with specified format
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: format,
    });

    // Step 4: Calculate dimensions explicitly (per RESEARCH.md Pitfall 4)
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Apply margins (10mm on each side)
    const marginLeft = 10;
    const marginTop = 10;
    const marginRight = 10;
    const marginBottom = 10;

    const availableWidth = pdfWidth - marginLeft - marginRight;
    const availableHeight = pdfHeight - marginTop - marginBottom;

    // Calculate image dimensions proportionally
    const imgWidth = availableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Step 5: Handle multi-page if content exceeds page height
    if (imgHeight > availableHeight) {
      // Scale down to fit single page
      const scaleFactor = availableHeight / imgHeight;
      const scaledWidth = imgWidth * scaleFactor;
      const scaledHeight = imgHeight * scaleFactor;

      // Center horizontally if scaled down
      const xOffset = marginLeft + (availableWidth - scaledWidth) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, marginTop, scaledWidth, scaledHeight);
    } else {
      // Fits on single page without scaling
      pdf.addImage(imgData, 'PNG', marginLeft, marginTop, imgWidth, imgHeight);
    }

    // Step 6: Add PDF metadata
    pdf.setProperties({
      title: lineupName,
      subject: 'Rowing Lineup',
      author: 'RowLab',
      creator: 'RowLab Lineup Builder',
    });

    // Step 7: Generate filename with date
    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const sanitizedName = lineupName.replace(/[^a-zA-Z0-9-_]/g, '_'); // Remove special chars
    const filename = `${sanitizedName}-${dateStr}.pdf`;

    // Step 8: Trigger download
    pdf.save(filename);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
}

/**
 * Calculate estimated PDF page count for given element
 * Useful for showing page count preview before export
 *
 * @param element - HTML element to measure
 * @param format - Paper format
 * @returns Estimated page count
 */
export function estimatePdfPageCount(
  element: HTMLElement,
  format: 'a4' | 'letter' = 'letter'
): number {
  // Page dimensions in mm
  const pageDimensions = {
    letter: { width: 215.9, height: 279.4 },
    a4: { width: 210, height: 297 },
  };

  const { height: pageHeight } = pageDimensions[format];
  const margins = 20; // 10mm top + 10mm bottom
  const availableHeight = pageHeight - margins;

  // Convert element height from pixels to mm (rough estimate: 96 DPI)
  const elementHeightMm = (element.scrollHeight * 25.4) / 96;

  return Math.ceil(elementHeightMm / availableHeight);
}

export default exportLineupToPdf;
