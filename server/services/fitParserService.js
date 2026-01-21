/**
 * FIT File Parser Service
 *
 * Parses Garmin, Polar, Suunto, and other FIT format files
 * and converts them to RowLab workout format.
 */

import FitParser from 'fit-file-parser';
import logger from '../utils/logger.js';

/**
 * Parse a FIT file buffer and extract workout data
 * @param {Buffer} fileBuffer - The FIT file as a buffer
 * @returns {Promise<Object>} Parsed workout data
 */
export async function parseFitFile(fileBuffer) {
  return new Promise((resolve, reject) => {
    const fitParser = new FitParser({
      force: true,
      speedUnit: 'm/s',
      lengthUnit: 'm',
      temperatureUnit: 'celsius',
      elapsedRecordField: true,
      mode: 'cascade',
    });

    fitParser.parse(fileBuffer, (error, data) => {
      if (error) {
        logger.error('FIT parse error', { error: error.message });
        reject(new Error(`Failed to parse FIT file: ${error.message}`));
        return;
      }

      try {
        const workout = extractWorkoutData(data);
        resolve(workout);
      } catch (extractError) {
        logger.error('FIT extract error', { error: extractError.message });
        reject(new Error(`Failed to extract workout data: ${extractError.message}`));
      }
    });
  });
}

/**
 * Extract workout data from parsed FIT data
 * @param {Object} fitData - Raw parsed FIT data
 * @returns {Object} Normalized workout data
 */
function extractWorkoutData(fitData) {
  const sessions = fitData.sessions || [];
  const records = fitData.records || [];
  const laps = fitData.laps || [];
  const activity = fitData.activity || {};

  if (sessions.length === 0) {
    throw new Error('No workout sessions found in FIT file');
  }

  // Use the first session (most FIT files have one main session)
  const session = sessions[0];

  // Determine workout type from sport
  const workoutType = mapSportToWorkoutType(session.sport, session.sub_sport);

  // Extract basic workout info
  const workout = {
    type: workoutType,
    date: session.start_time || new Date(),
    duration: session.total_timer_time || 0, // seconds
    distance: session.total_distance || 0, // meters
    calories: session.total_calories || 0,
    avgHeartRate: session.avg_heart_rate || null,
    maxHeartRate: session.max_heart_rate || null,
    avgPower: session.avg_power || null,
    maxPower: session.max_power || null,
    avgCadence: session.avg_cadence || null,
    maxCadence: session.max_cadence || null,
    avgSpeed: session.avg_speed || null, // m/s
    maxSpeed: session.max_speed || null, // m/s
    totalAscent: session.total_ascent || null,
    totalDescent: session.total_descent || null,
    sport: session.sport,
    subSport: session.sub_sport,
    source: 'garmin_fit',
  };

  // Extract rowing-specific metrics if available
  if (workoutType === 'row' || workoutType === 'erg') {
    workout.avgStrokeRate = session.avg_stroke_rate || session.avg_cadence || null;
    workout.maxStrokeRate = session.max_stroke_rate || session.max_cadence || null;
    workout.totalStrokes = session.total_strokes || null;

    // Calculate split time (500m pace) if we have distance and time
    if (workout.distance > 0 && workout.duration > 0) {
      const metersPerSecond = workout.distance / workout.duration;
      workout.splitTime = metersPerSecond > 0 ? 500 / metersPerSecond : null;
    }
  }

  // Extract lap/interval data
  if (laps.length > 0) {
    workout.laps = laps.map((lap, index) => ({
      number: index + 1,
      startTime: lap.start_time,
      duration: lap.total_timer_time || 0,
      distance: lap.total_distance || 0,
      avgHeartRate: lap.avg_heart_rate || null,
      maxHeartRate: lap.max_heart_rate || null,
      avgPower: lap.avg_power || null,
      avgCadence: lap.avg_cadence || null,
      avgSpeed: lap.avg_speed || null,
      calories: lap.total_calories || null,
    }));
  }

  // Extract time series data (for detailed charts)
  if (records.length > 0) {
    workout.telemetry = extractTelemetry(records);
  }

  // Calculate derived metrics
  if (workout.distance > 0 && workout.duration > 0) {
    // Average pace in seconds per 500m (for rowing/erg)
    const avgPace500m = (workout.duration / workout.distance) * 500;
    workout.avgPace = avgPace500m;
  }

  return workout;
}

/**
 * Map FIT sport type to RowLab workout type
 */
function mapSportToWorkoutType(sport, subSport) {
  // Sport codes from FIT SDK
  const sportMap = {
    'rowing': 'row',
    'indoor_rowing': 'erg',
    'running': 'run',
    'cycling': 'bike',
    'swimming': 'swim',
    'walking': 'walk',
    'hiking': 'hike',
    'fitness_equipment': 'cross_train',
    'training': 'cross_train',
    'cardio_training': 'cross_train',
    'strength_training': 'strength',
    'paddling': 'paddle',
    'kayaking': 'paddle',
    'stand_up_paddleboarding': 'paddle',
  };

  // Check sub_sport first for more specific type
  if (subSport && sportMap[subSport]) {
    return sportMap[subSport];
  }

  // Then check main sport
  if (sport && sportMap[sport]) {
    return sportMap[sport];
  }

  // Handle numeric sport codes
  const sportCodeMap = {
    0: 'cross_train', // generic
    1: 'run',
    2: 'bike',
    5: 'swim',
    10: 'cross_train', // fitness equipment
    15: 'row', // rowing
    37: 'walk', // walking
  };

  if (typeof sport === 'number' && sportCodeMap[sport]) {
    return sportCodeMap[sport];
  }

  return 'cross_train'; // Default
}

/**
 * Extract telemetry data from records
 */
function extractTelemetry(records) {
  // Downsample if there are too many records (>3000)
  const maxRecords = 3000;
  let sampledRecords = records;

  if (records.length > maxRecords) {
    const sampleRate = Math.ceil(records.length / maxRecords);
    sampledRecords = records.filter((_, index) => index % sampleRate === 0);
  }

  return sampledRecords.map((record, index) => ({
    timestamp: record.timestamp || index,
    elapsed: record.elapsed_time || index,
    heartRate: record.heart_rate || null,
    power: record.power || null,
    cadence: record.cadence || null,
    speed: record.speed || null,
    distance: record.distance || null,
    altitude: record.altitude || null,
    position: record.position_lat && record.position_long ? {
      lat: record.position_lat,
      lng: record.position_long,
    } : null,
  }));
}

/**
 * Validate that a file is a valid FIT file
 */
export function validateFitFile(buffer) {
  // FIT files start with a header
  // First byte is header size (usually 12 or 14)
  // Bytes 8-11 should be '.FIT' signature
  if (buffer.length < 12) {
    return { valid: false, error: 'File too small to be a valid FIT file' };
  }

  const headerSize = buffer[0];
  if (headerSize !== 12 && headerSize !== 14) {
    return { valid: false, error: 'Invalid FIT file header size' };
  }

  // Check for .FIT signature at bytes 8-11
  const signature = buffer.slice(8, 12).toString('ascii');
  if (signature !== '.FIT') {
    return { valid: false, error: 'Invalid FIT file signature' };
  }

  return { valid: true };
}

/**
 * Convert parsed workout to RowLab workout format for database
 */
export function toRowLabWorkout(parsedData, userId, teamId, athleteId = null) {
  return {
    userId,
    teamId,
    athleteId,
    type: parsedData.type,
    date: new Date(parsedData.date),
    duration: Math.round(parsedData.duration),
    distance: Math.round(parsedData.distance),
    calories: parsedData.calories || null,
    avgHeartRate: parsedData.avgHeartRate || null,
    maxHeartRate: parsedData.maxHeartRate || null,
    avgPower: parsedData.avgPower || null,
    maxPower: parsedData.maxPower || null,
    avgStrokeRate: parsedData.avgStrokeRate || parsedData.avgCadence || null,
    splitTime: parsedData.splitTime ? Math.round(parsedData.splitTime * 10) / 10 : null,
    source: 'garmin_fit',
    notes: `Imported from Garmin .FIT file (${parsedData.sport || 'Unknown activity'})`,
    metadata: {
      sport: parsedData.sport,
      subSport: parsedData.subSport,
      totalAscent: parsedData.totalAscent,
      totalDescent: parsedData.totalDescent,
      lapCount: parsedData.laps?.length || 0,
    },
  };
}

export default {
  parseFitFile,
  validateFitFile,
  toRowLabWorkout,
};
