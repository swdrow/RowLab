/**
 * Lineup Excel Export - Phase 18 LINEUP-05
 *
 * Exports lineup data to Excel format with optional rigging and equipment sheets.
 * Uses lazy-loaded xlsx library to avoid bundle bloat (~400kb).
 */

import type { RiggingDefaults } from '../types/rigging';

interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  weightKg?: number | null;
  side?: string | null;
}

interface Seat {
  seatNumber: number;
  side: 'Port' | 'Starboard';
  athlete: Athlete | null;
  isCoxswain?: boolean;
}

interface Boat {
  id: string;
  name: string;
  shellName?: string | null;
  seats: Seat[];
  coxswain?: Athlete | null;
}

interface LineupExportData {
  name: string;
  notes?: string | null;
  boats: Boat[];
  rigging?: Record<string, RiggingDefaults>;
  equipment?: Array<{
    shellName: string;
    oarSetName?: string | null;
  }>;
}

interface ExportOptions {
  includeRigging?: boolean;
  includeEquipment?: boolean;
  includeAthleteDetails?: boolean;
}

/**
 * Export lineup to Excel file
 *
 * Lazy loads xlsx library on first use to avoid bundle bloat.
 */
export async function exportLineupToExcel(
  lineup: LineupExportData,
  options: ExportOptions = {}
): Promise<void> {
  // Lazy load xlsx library (~400kb)
  const XLSX = await import('xlsx');

  const workbook = XLSX.utils.book_new();

  // Sheet 1: Lineup Assignments
  const lineupRows: Array<Record<string, string | number | null>> = [];

  for (const boat of lineup.boats) {
    // Add seats (stroke to bow)
    const sortedSeats = [...boat.seats].sort((a, b) => b.seatNumber - a.seatNumber);

    for (const seat of sortedSeats) {
      const row: Record<string, string | number | null> = {
        'Boat Class': boat.name,
        'Shell': boat.shellName || '',
        'Seat': seat.seatNumber,
        'Side': seat.side,
        'Athlete': seat.athlete
          ? `${seat.athlete.firstName} ${seat.athlete.lastName}`
          : '',
      };

      if (options.includeAthleteDetails && seat.athlete) {
        row['Weight (kg)'] = seat.athlete.weightKg ?? '';
        row['Side Pref'] = seat.athlete.side || '';
      }

      lineupRows.push(row);
    }

    // Add coxswain if present
    if (boat.coxswain) {
      const row: Record<string, string | number | null> = {
        'Boat Class': boat.name,
        'Shell': boat.shellName || '',
        'Seat': 'Cox',
        'Side': '',
        'Athlete': `${boat.coxswain.firstName} ${boat.coxswain.lastName}`,
      };

      if (options.includeAthleteDetails) {
        row['Weight (kg)'] = boat.coxswain.weightKg ?? '';
        row['Side Pref'] = 'Cox';
      }

      lineupRows.push(row);
    }

    // Add empty row between boats
    if (lineup.boats.indexOf(boat) < lineup.boats.length - 1) {
      lineupRows.push({});
    }
  }

  const lineupSheet = XLSX.utils.json_to_sheet(lineupRows);

  // Set column widths
  lineupSheet['!cols'] = [
    { wch: 12 }, // Boat Class
    { wch: 15 }, // Shell
    { wch: 6 },  // Seat
    { wch: 10 }, // Side
    { wch: 25 }, // Athlete
    { wch: 12 }, // Weight
    { wch: 12 }, // Side Pref
  ];

  XLSX.utils.book_append_sheet(workbook, lineupSheet, 'Lineup');

  // Sheet 2: Rigging (optional)
  if (options.includeRigging && lineup.rigging) {
    const riggingRows: Array<Record<string, string | number>> = [];

    for (const [shellName, rigging] of Object.entries(lineup.rigging)) {
      riggingRows.push({
        'Shell': shellName,
        'Spread/Span (cm)': rigging.spread ?? rigging.span ?? '',
        'Catch Angle (deg)': rigging.catchAngle ?? '',
        'Finish Angle (deg)': rigging.finishAngle ?? '',
        'Oar Length (cm)': rigging.oarLength ?? '',
        'Inboard (cm)': rigging.inboard ?? '',
        'Pitch (deg)': rigging.pitch ?? '',
        'Gate Height (mm)': rigging.gateHeight ?? '',
      });
    }

    if (riggingRows.length > 0) {
      const riggingSheet = XLSX.utils.json_to_sheet(riggingRows);
      riggingSheet['!cols'] = [
        { wch: 15 }, // Shell
        { wch: 15 }, // Spread/Span
        { wch: 15 }, // Catch
        { wch: 15 }, // Finish
        { wch: 15 }, // Oar Length
        { wch: 12 }, // Inboard
        { wch: 10 }, // Pitch
        { wch: 15 }, // Gate Height
      ];
      XLSX.utils.book_append_sheet(workbook, riggingSheet, 'Rigging');
    }
  }

  // Sheet 3: Equipment (optional)
  if (options.includeEquipment && lineup.equipment && lineup.equipment.length > 0) {
    const equipmentRows = lineup.equipment.map((e) => ({
      'Shell': e.shellName,
      'Oar Set': e.oarSetName || '',
    }));

    const equipmentSheet = XLSX.utils.json_to_sheet(equipmentRows);
    equipmentSheet['!cols'] = [
      { wch: 15 }, // Shell
      { wch: 20 }, // Oar Set
    ];
    XLSX.utils.book_append_sheet(workbook, equipmentSheet, 'Equipment');
  }

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${lineup.name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.xlsx`;

  // Write and download
  XLSX.writeFile(workbook, filename);
}

/**
 * Generate preview data for export (without triggering download)
 */
export function generateExportPreview(
  lineup: LineupExportData,
  options: ExportOptions = {}
): {
  lineupRowCount: number;
  sheetsCount: number;
  estimatedSize: string;
} {
  let rowCount = 0;
  for (const boat of lineup.boats) {
    rowCount += boat.seats.length + (boat.coxswain ? 1 : 0);
  }

  let sheetsCount = 1;
  if (options.includeRigging && lineup.rigging) sheetsCount++;
  if (options.includeEquipment && lineup.equipment?.length) sheetsCount++;

  // Rough estimate: ~500 bytes per row + overhead
  const estimatedBytes = rowCount * 500 + sheetsCount * 1000;
  const estimatedSize =
    estimatedBytes > 1024
      ? `${(estimatedBytes / 1024).toFixed(1)} KB`
      : `${estimatedBytes} bytes`;

  return {
    lineupRowCount: rowCount,
    sheetsCount,
    estimatedSize,
  };
}
