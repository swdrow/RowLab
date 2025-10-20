import Papa from 'papaparse';

/**
 * Parse CSV file from URL or file path
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Array>} Parsed data array
 */
export const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    Papa.parse(filePath, {
      download: true,
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Normalize headers: trim whitespace and convert to camelCase-like format
        return header.trim().replace(/\s+/g, '');
      },
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error('CSV parsing errors:', results.errors);
        }
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

/**
 * Load athlete data from combined athletes.csv
 * Contains: Last Name, First Name, Country, Side
 * Side codes: P=Port, S=Starboard, B=Both, Cox=Coxswain
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Array>} Array of athlete objects
 */
export const loadAthletes = async (filePath = '/api/data/athletes.csv') => {
  try {
    const data = await parseCSV(filePath);

    return data.map((row, index) => {
      // Handle various possible column name formats
      const lastName = row.LastName || row['Last Name'] || row.lastname || 'Unknown';
      const firstName = row.FirstName || row['First Name'] || row.firstname || '';
      const country = row.Country || row.CountryCode || row['Country Code'] || 'USA';
      const side = row.Side || row.side || '';

      // Parse side capabilities
      let port = 0;
      let starboard = 0;
      let isCoxswain = 0;

      if (side === 'P') {
        port = 1;
        starboard = 0;
      } else if (side === 'S') {
        port = 0;
        starboard = 1;
      } else if (side === 'B') {
        port = 1;
        starboard = 1;
      } else if (side === 'Cox') {
        isCoxswain = 1;
      } else {
        // Default: can row both sides if no side specified
        port = 1;
        starboard = 1;
      }

      return {
        id: `athlete-${index}`,
        lastName: lastName.trim(),
        firstName: firstName.trim(),
        country: country.trim(),
        side: side, // Store original side code
        port: port,
        starboard: starboard,
        sculling: row.Sculling !== undefined ? parseInt(row.Sculling) : 0,
        isCoxswain: isCoxswain,
      };
    }).filter(athlete => athlete.lastName && athlete.lastName !== 'Unknown');
  } catch (error) {
    console.error('Error loading athletes:', error);
    return [];
  }
};

/**
 * Load boat configurations from boats.csv
 * @param {string} filePath - Path to boats CSV
 * @returns {Promise<Array>} Array of boat configurations
 */
export const loadBoats = async (filePath = '/data/boats.csv') => {
  try {
    const data = await parseCSV(filePath);

    return data.map((row, index) => ({
      id: `boat-config-${index}`,
      name: row.BoatName || row.boatname || 'Unknown Boat',
      numSeats: parseInt(row.NumSeats || row.numseats || 8),
      hasCoxswain: parseInt(row.HasCoxswain || row.hascoxswain || 0) === 1,
    }));
  } catch (error) {
    console.error('Error loading boats:', error);
    return [];
  }
};

/**
 * Load shell names from CSV
 * @param {string} filePath - Path to shells CSV
 * @returns {Promise<Array>} Array of shell objects
 */
export const loadShells = async (filePath = '/data/shells.csv') => {
  try {
    const data = await parseCSV(filePath);

    return data.map((row, index) => ({
      id: `shell-${index}`,
      name: row.ShellName || row.shellname || '',
      boatClass: row.BoatClass || row.boatclass || '',
      notes: row.Notes || row.notes || '',
    }));
  } catch (error) {
    console.error('Error loading shells:', error);
    return [];
  }
};

/**
 * Load erg testing data from CSV (template - for future use)
 * @param {string} filePath - Path to erg data CSV
 * @returns {Promise<Array>} Array of erg test results
 */
export const loadErgData = async (filePath = '/data/erg_data_template.csv') => {
  try {
    const data = await parseCSV(filePath);

    return data.map((row, index) => ({
      id: `erg-${index}`,
      lastName: row.LastName || row.lastname || '',
      firstName: row.FirstName || row.firstname || '',
      date: row.Date || row.date || '',
      testType: row.TestType || row.testtype || '',
      result: row.Result || row.result || '',
      split: row.Split || row.split || '',
      strokeRate: parseInt(row.StrokeRate || row.strokerate || 0),
      watts: parseInt(row.Watts || row.watts || 0),
    }));
  } catch (error) {
    console.error('Error loading erg data:', error);
    return [];
  }
};
