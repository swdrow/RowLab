#!/usr/bin/env node

import fs from 'fs/promises';
import Papa from 'papaparse';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function combineCSVs() {
  console.log('Combining CSV files...\n');

  // Read both CSV files
  const countryCSV = await fs.readFile('/home/swd/Rowing/LN_Country.csv', 'utf-8');
  const sidesCSV = await fs.readFile('/home/swd/Rowing/Sides.csv', 'utf-8');

  // Parse country data
  const countryData = Papa.parse(countryCSV, { header: true, skipEmptyLines: true });
  const countryMap = new Map();

  countryData.data.forEach(row => {
    const lastName = row['Last Name']?.trim();
    const country = row['Country Code']?.trim();
    if (lastName && country) {
      countryMap.set(lastName, country);
    }
  });

  console.log(`Loaded ${countryMap.size} athletes from LN_Country.csv`);

  // Parse sides data (skip first empty line)
  const sidesLines = sidesCSV.split('\n');
  const sidesCSVCleaned = sidesLines.slice(1).join('\n'); // Skip first line
  const sidesData = Papa.parse(sidesCSVCleaned, { header: true, skipEmptyLines: true });
  const combined = [];

  sidesData.data.forEach(row => {
    const lastName = row['Last Name']?.trim();
    const firstName = row['First Name']?.trim();
    const side = row['Side']?.trim();

    if (lastName && lastName !== 'Last Name') { // Skip if it's the header
      const country = countryMap.get(lastName) || 'USA'; // Default to USA if not found

      combined.push({
        'Last Name': lastName,
        'First Name': firstName || '',
        'Country': country,
        'Side': side || ''
      });
    }
  });

  console.log(`Combined ${combined.length} athletes from Sides.csv\n`);

  // Generate CSV output
  const csv = Papa.unparse(combined, {
    header: true,
    columns: ['Last Name', 'First Name', 'Country', 'Side']
  });

  // Write to data directory
  const outputPath = path.join(__dirname, '../data/athletes.csv');
  await fs.writeFile(outputPath, csv, 'utf-8');

  console.log(`✓ Combined CSV saved to: ${outputPath}`);
  console.log(`✓ Total athletes: ${combined.length}\n`);

  // Show sample
  console.log('Sample data:');
  console.table(combined.slice(0, 10));
}

combineCSVs().catch(err => {
  console.error('Error combining CSVs:', err);
  process.exit(1);
});
