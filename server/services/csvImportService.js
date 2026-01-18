import { parse } from 'csv-parse/sync';
import { prisma } from '../db/connection.js';
import { createErgTest } from './ergTestService.js';

/**
 * Parse CSV content and return rows
 */
export function parseCSV(content, options = {}) {
  const { delimiter = ',', hasHeaders = true } = options;

  const records = parse(content, {
    delimiter,
    columns: hasHeaders,
    skip_empty_lines: true,
    trim: true,
  });

  return records;
}

/**
 * Detect column mapping from CSV headers
 */
export function detectColumnMapping(headers) {
  const mapping = {};
  const patterns = {
    athlete: /^(athlete|name|rower|first\s*name)$/i,
    lastName: /^(last\s*name|surname|family\s*name)$/i,
    firstName: /^(first\s*name|given\s*name)$/i,
    testType: /^(test\s*type|type|event|distance)$/i,
    date: /^(date|test\s*date|when)$/i,
    time: /^(time|result|finish|total\s*time)$/i,
    split: /^(split|pace|500m|avg\s*split)$/i,
    watts: /^(watts|power|avg\s*watts|average\s*watts)$/i,
    strokeRate: /^(stroke\s*rate|spm|rate|s\/m)$/i,
    weight: /^(weight|body\s*weight|kg|mass)$/i,
    notes: /^(notes|comments|memo)$/i,
  };

  for (const header of headers) {
    for (const [field, pattern] of Object.entries(patterns)) {
      if (pattern.test(header)) {
        mapping[field] = header;
        break;
      }
    }
  }

  return mapping;
}

/**
 * Parse time string to seconds (handles MM:SS.s, H:MM:SS.s, SS.s)
 */
export function parseTimeToSeconds(timeStr) {
  if (!timeStr) return null;

  const str = String(timeStr).trim();

  // Already a number (seconds)
  if (/^\d+\.?\d*$/.test(str)) {
    return parseFloat(str);
  }

  // MM:SS.s or H:MM:SS.s
  const parts = str.split(':');
  if (parts.length === 2) {
    // MM:SS.s
    const [minutes, seconds] = parts;
    return parseInt(minutes) * 60 + parseFloat(seconds);
  } else if (parts.length === 3) {
    // H:MM:SS.s
    const [hours, minutes, seconds] = parts;
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
  }

  return null;
}

/**
 * Parse test type from various formats
 */
export function parseTestType(value) {
  if (!value) return null;

  const str = String(value).toLowerCase().trim();

  if (str.includes('2k') || str.includes('2000')) return '2k';
  if (str.includes('6k') || str.includes('6000')) return '6k';
  if (str.includes('30') && str.includes('min')) return '30min';
  if (str.includes('500') || str.includes('0.5k')) return '500m';

  return null;
}

/**
 * Match athlete name to team athletes
 */
export async function matchAthlete(teamId, name, firstName, lastName) {
  // If we have separate first/last names
  if (firstName && lastName) {
    const athlete = await prisma.athlete.findFirst({
      where: {
        teamId,
        firstName: { equals: firstName, mode: 'insensitive' },
        lastName: { equals: lastName, mode: 'insensitive' },
      },
    });
    if (athlete) return athlete;
  }

  // Try to parse full name
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      const first = parts[0];
      const last = parts.slice(1).join(' ');

      const athlete = await prisma.athlete.findFirst({
        where: {
          teamId,
          firstName: { equals: first, mode: 'insensitive' },
          lastName: { equals: last, mode: 'insensitive' },
        },
      });
      if (athlete) return athlete;

      // Try last name first
      const lastFirst = parts[parts.length - 1];
      const firstLast = parts.slice(0, -1).join(' ');

      const athlete2 = await prisma.athlete.findFirst({
        where: {
          teamId,
          firstName: { equals: firstLast, mode: 'insensitive' },
          lastName: { equals: lastFirst, mode: 'insensitive' },
        },
      });
      if (athlete2) return athlete2;
    }
  }

  return null;
}

/**
 * Validate and transform CSV row to erg test data
 */
export async function validateRow(teamId, row, mapping) {
  const errors = [];
  const data = {};

  // Find athlete
  const athleteName = row[mapping.athlete] || '';
  const firstName = row[mapping.firstName] || '';
  const lastName = row[mapping.lastName] || '';

  const athlete = await matchAthlete(teamId, athleteName, firstName, lastName);
  if (!athlete) {
    errors.push(`Athlete not found: ${athleteName || `${firstName} ${lastName}`}`);
  } else {
    data.athleteId = athlete.id;
  }

  // Parse test type
  const testType = parseTestType(row[mapping.testType]);
  if (!testType) {
    errors.push(`Invalid test type: ${row[mapping.testType]}`);
  } else {
    data.testType = testType;
  }

  // Parse date
  const dateStr = row[mapping.date];
  if (dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      errors.push(`Invalid date: ${dateStr}`);
    } else {
      data.testDate = date.toISOString();
    }
  } else {
    errors.push('Missing date');
  }

  // Parse time
  const timeSeconds = parseTimeToSeconds(row[mapping.time]);
  if (timeSeconds === null) {
    errors.push(`Invalid time: ${row[mapping.time]}`);
  } else {
    data.timeSeconds = timeSeconds;
  }

  // Optional fields
  if (mapping.split && row[mapping.split]) {
    data.splitSeconds = parseTimeToSeconds(row[mapping.split]);
  }
  if (mapping.watts && row[mapping.watts]) {
    data.watts = parseInt(row[mapping.watts]) || null;
  }
  if (mapping.strokeRate && row[mapping.strokeRate]) {
    data.strokeRate = parseInt(row[mapping.strokeRate]) || null;
  }
  if (mapping.weight && row[mapping.weight]) {
    data.weightKg = parseFloat(row[mapping.weight]) || null;
  }
  if (mapping.notes && row[mapping.notes]) {
    data.notes = row[mapping.notes];
  }

  return { data, errors };
}

/**
 * Preview CSV import (validate without saving)
 */
export async function previewCSVImport(teamId, content, options = {}) {
  const rows = parseCSV(content, options);
  if (rows.length === 0) {
    return { valid: [], invalid: [], headers: [] };
  }

  const headers = Object.keys(rows[0]);
  const mapping = options.mapping || detectColumnMapping(headers);

  const valid = [];
  const invalid = [];

  for (let i = 0; i < rows.length; i++) {
    const { data, errors } = await validateRow(teamId, rows[i], mapping);

    if (errors.length === 0) {
      valid.push({ row: i + 1, data });
    } else {
      invalid.push({ row: i + 1, errors, original: rows[i] });
    }
  }

  return { valid, invalid, headers, mapping, totalRows: rows.length };
}

/**
 * Execute CSV import (save valid rows)
 */
export async function executeCSVImport(teamId, validRows) {
  const results = { created: 0, errors: [] };

  for (const item of validRows) {
    try {
      await createErgTest(teamId, item.data);
      results.created++;
    } catch (error) {
      results.errors.push({ row: item.row, error: error.message });
    }
  }

  return results;
}
