import * as Papa from 'papaparse';
import { z } from 'zod';
import type { TestType, CreateErgTestInput } from '../types/ergTests';
import type { Athlete } from '../types/athletes';

// Target column names for erg test import
export const ERG_TEST_COLUMNS = [
  'athleteName',
  'testType',
  'testDate',
  'timeSeconds',
  'distanceM',
  'splitSeconds',
  'watts',
  'strokeRate',
  'weightKg',
  'notes',
] as const;

export type ErgTestColumn = (typeof ERG_TEST_COLUMNS)[number];

export interface ColumnMapping {
  [key: string]: string | null; // target -> source column
}

export interface ParsedCSV {
  headers: string[];
  data: Record<string, unknown>[];
  rowCount: number;
}

export interface ValidationError {
  row: number;
  column: string;
  message: string;
  value: unknown;
}

export interface ValidatedRow {
  data: Record<string, unknown>;
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Parse CSV file using PapaParse
 * Uses worker thread for large files (>500KB)
 */
export function parseErgCSV(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: 'greedy',
      worker: file.size > 500 * 1024, // Use worker for files > 500KB
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          // Log parse errors but continue with valid data
          console.warn('CSV parse warnings:', results.errors);
        }
        resolve({
          headers: results.meta.fields || [],
          data: results.data as Record<string, unknown>[],
          rowCount: results.data.length,
        });
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
}

/**
 * Normalize string for fuzzy matching
 */
function normalize(str: string): string {
  return str.toLowerCase().replace(/[_\s\-\.]/g, '');
}

/**
 * Auto-map CSV columns to target erg test fields
 * Uses fuzzy matching for common variations
 */
export function autoMapErgColumns(csvHeaders: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};

  // Aliases for common variations
  const aliases: Record<ErgTestColumn, string[]> = {
    athleteName: ['athlete', 'name', 'fullname', 'rower', 'firstname', 'lastname'],
    testType: ['type', 'test', 'distance', 'piece', 'workout'],
    testDate: ['date', 'when', 'day', 'timestamp', 'completed'],
    timeSeconds: ['time', 'duration', 'seconds', 'total', 'finaltime', 'result'],
    distanceM: ['distance', 'meters', 'dist', 'm'],
    splitSeconds: ['split', 'pace', 'avgpace', 'average', 'per500', '500split'],
    watts: ['power', 'avgwatts', 'averagepower', 'wattage'],
    strokeRate: ['rate', 'spm', 'strokerate', 'strokes', 'avgrate', 'sr'],
    weightKg: ['weight', 'bodyweight', 'kg', 'mass', 'bw'],
    notes: ['note', 'comments', 'remarks', 'description'],
  };

  ERG_TEST_COLUMNS.forEach((target) => {
    const normalizedTarget = normalize(target);
    const targetAliases = aliases[target] || [];

    // Find best matching header
    const match = csvHeaders.find((header) => {
      const normalizedHeader = normalize(header);

      // Exact match
      if (normalizedHeader === normalizedTarget) return true;

      // Alias match
      if (targetAliases.some((alias) => normalizedHeader === alias)) return true;

      // Contains match
      if (normalizedHeader.includes(normalizedTarget)) return true;
      if (targetAliases.some((alias) => normalizedHeader.includes(alias))) return true;

      // Reverse contains
      if (normalizedTarget.includes(normalizedHeader)) return true;

      return false;
    });

    mapping[target] = match || null;
  });

  return mapping;
}

/**
 * Parse time string to seconds
 * Handles formats: "6:30.5", "6:30", "390.5", "390", "1:06:30"
 */
export function parseTimeToSeconds(timeStr: string | number): number | null {
  if (typeof timeStr === 'number') return timeStr;
  if (!timeStr) return null;

  const str = String(timeStr).trim();

  // Already in seconds (e.g., "390.5")
  if (!str.includes(':')) {
    const seconds = parseFloat(str);
    return isNaN(seconds) ? null : seconds;
  }

  // MM:SS or MM:SS.s format
  const parts = str.split(':');

  if (parts.length === 2) {
    // MM:SS.s format (e.g., "6:30.5")
    const minutes = parseInt(parts[0], 10);
    const seconds = parseFloat(parts[1]);

    if (isNaN(minutes) || isNaN(seconds)) return null;
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    // HH:MM:SS format (e.g., "1:06:30")
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseFloat(parts[2]);

    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return null;
    return hours * 3600 + minutes * 60 + seconds;
  }

  return null;
}

/**
 * Parse and normalize test type
 * Handles: "2k", "2K", "2000m", "2000" -> "2k"
 */
export function parseTestType(value: string | number): TestType | null {
  if (!value) return null;

  const str = String(value).toLowerCase().replace(/[_\s]/g, '');

  // Remove 'm', 'meters', or 'meter' suffix
  const normalized = str.replace(/m(eters?)?$/, '');

  // Test type mappings
  const typeMap: Record<string, TestType> = {
    '2k': '2k',
    '2000': '2k',
    '6k': '6k',
    '6000': '6k',
    '30min': '30min',
    '30': '30min',
    'thirty': '30min',
    '500': '500m',
  };

  return typeMap[normalized] || null;
}

/**
 * Find athlete by name (fuzzy matching)
 */
function findAthleteByName(name: string, athletes: Athlete[]): Athlete | null {
  if (!name) return null;

  const searchName = normalize(name);

  // Try exact match first
  let match = athletes.find((a) =>
    normalize(`${a.firstName}${a.lastName}`) === searchName ||
    normalize(`${a.lastName}${a.firstName}`) === searchName
  );

  if (match) return match;

  // Try partial match (contains)
  match = athletes.find((a) => {
    const fullName = normalize(`${a.firstName}${a.lastName}`);
    const reverseName = normalize(`${a.lastName}${a.firstName}`);
    return fullName.includes(searchName) || reverseName.includes(searchName) ||
           searchName.includes(fullName) || searchName.includes(reverseName);
  });

  return match || null;
}

/**
 * Validate a single erg test row
 */
const ergTestRowSchema = z.object({
  athleteName: z.string().min(1, 'Athlete name is required'),
  testType: z.string().min(1, 'Test type is required'),
  testDate: z.string().min(1, 'Test date is required'),
  timeSeconds: z.union([z.number(), z.string()]).refine(
    (val) => {
      if (typeof val === 'number') return val > 0;
      const parsed = parseTimeToSeconds(val);
      return parsed !== null && parsed > 0;
    },
    { message: 'Valid time is required' }
  ),
  distanceM: z.union([z.number(), z.string()]).nullable().optional(),
  splitSeconds: z.union([z.number(), z.string()]).nullable().optional(),
  watts: z.number().nullable().optional(),
  strokeRate: z.number().nullable().optional(),
  weightKg: z.number().min(30).max(200).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type ValidatedErgTestData = CreateErgTestInput;

/**
 * Map and validate a CSV row using the column mapping
 */
export function validateErgTestRow(
  row: Record<string, unknown>,
  mapping: ColumnMapping,
  athletes: Athlete[],
  rowIndex: number
): ValidatedRow {
  // Map columns
  const mappedData: Record<string, unknown> = {};
  ERG_TEST_COLUMNS.forEach((target) => {
    const source = mapping[target];
    if (source && row[source] !== undefined && row[source] !== '') {
      mappedData[target] = row[source];
    } else {
      mappedData[target] = null;
    }
  });

  // Validate basic structure
  const result = ergTestRowSchema.safeParse(mappedData);

  if (!result.success) {
    const errors: ValidationError[] = result.error.issues.map((err) => ({
      row: rowIndex + 1,
      column: err.path.join('.'),
      message: err.message,
      value: mappedData[err.path[0] as string],
    }));

    return {
      data: mappedData,
      isValid: false,
      errors,
    };
  }

  // Find athlete
  const athlete = findAthleteByName(result.data.athleteName, athletes);
  if (!athlete) {
    return {
      data: mappedData,
      isValid: false,
      errors: [
        {
          row: rowIndex + 1,
          column: 'athleteName',
          message: `Athlete not found: ${result.data.athleteName}`,
          value: result.data.athleteName,
        },
      ],
    };
  }

  // Parse test type
  const testType = parseTestType(result.data.testType);
  if (!testType) {
    return {
      data: mappedData,
      isValid: false,
      errors: [
        {
          row: rowIndex + 1,
          column: 'testType',
          message: `Invalid test type: ${result.data.testType}. Must be 2k, 6k, 30min, or 500m`,
          value: result.data.testType,
        },
      ],
    };
  }

  // Parse time
  const timeSeconds = parseTimeToSeconds(result.data.timeSeconds);
  if (!timeSeconds || timeSeconds <= 0) {
    return {
      data: mappedData,
      isValid: false,
      errors: [
        {
          row: rowIndex + 1,
          column: 'timeSeconds',
          message: `Invalid time format: ${result.data.timeSeconds}`,
          value: result.data.timeSeconds,
        },
      ],
    };
  }

  // Parse optional split time
  let splitSeconds: number | null = null;
  if (result.data.splitSeconds) {
    splitSeconds = parseTimeToSeconds(result.data.splitSeconds);
  }

  // Parse optional distance
  let distanceM: number | null = null;
  if (result.data.distanceM) {
    distanceM = typeof result.data.distanceM === 'number'
      ? result.data.distanceM
      : parseFloat(String(result.data.distanceM));
  }

  // Parse date (handle various formats)
  let testDate: string;
  try {
    const dateStr = String(result.data.testDate);
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      return {
        data: mappedData,
        isValid: false,
        errors: [
          {
            row: rowIndex + 1,
            column: 'testDate',
            message: `Invalid date format: ${dateStr}`,
            value: dateStr,
          },
        ],
      };
    }
    testDate = parsed.toISOString().split('T')[0]; // YYYY-MM-DD format
  } catch (err) {
    return {
      data: mappedData,
      isValid: false,
      errors: [
        {
          row: rowIndex + 1,
          column: 'testDate',
          message: `Invalid date: ${result.data.testDate}`,
          value: result.data.testDate,
        },
      ],
    };
  }

  // Build valid erg test data
  const validData: CreateErgTestInput = {
    athleteId: athlete.id,
    testType,
    testDate,
    timeSeconds,
    distanceM,
    splitSeconds,
    watts: result.data.watts || null,
    strokeRate: result.data.strokeRate || null,
    weightKg: result.data.weightKg || null,
    notes: result.data.notes || null,
  };

  return {
    data: validData,
    isValid: true,
    errors: [],
  };
}

/**
 * Validate all rows and return summary
 */
export function validateAllErgRows(
  data: Record<string, unknown>[],
  mapping: ColumnMapping,
  athletes: Athlete[]
): {
  validRows: ValidatedErgTestData[];
  invalidRows: { row: number; errors: ValidationError[] }[];
  totalValid: number;
  totalInvalid: number;
} {
  const validRows: ValidatedErgTestData[] = [];
  const invalidRows: { row: number; errors: ValidationError[] }[] = [];

  data.forEach((row, index) => {
    const result = validateErgTestRow(row, mapping, athletes, index);
    if (result.isValid) {
      validRows.push(result.data as ValidatedErgTestData);
    } else {
      invalidRows.push({ row: index + 1, errors: result.errors });
    }
  });

  return {
    validRows,
    invalidRows,
    totalValid: validRows.length,
    totalInvalid: invalidRows.length,
  };
}
