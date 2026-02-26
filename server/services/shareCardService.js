import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import prisma from '../db/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';
const UPLOAD_DIR = path.join(__dirname, '../../uploads/share-cards');

/**
 * Generate a share card by calling the Python rendering service
 */
export async function generateShareCard({ workoutId, cardType, format, options, userId, teamId }) {
  // Generate short share ID
  const { nanoid } = await import('nanoid');
  const shareId = nanoid(10);

  // Ensure upload directory exists
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  // Fetch workout data if workoutId provided
  let workoutData = {};
  let athleteName = null;
  if (workoutId) {
    const workout = await prisma.workout.findUnique({
      where: { id: workoutId },
      include: {
        splits: { orderBy: { splitNumber: 'asc' } },
        telemetry: true,
        athlete: true,
      },
    });

    if (!workout) {
      throw new Error('Workout not found');
    }

    workoutData = serializeWorkoutForPython(workout);
    athleteName = workout.athlete
      ? `${workout.athlete.firstName} ${workout.athlete.lastName}`
      : null;
  }

  // Fetch team data for branding (if teamId provided)
  let teamBranding = {};
  if (teamId) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { name: true, settings: true },
    });

    if (team) {
      teamBranding = {
        teamName: team.name,
        teamColor: team.settings?.brandColor || '#3B82F6',
        teamLogo: team.settings?.logoUrl || null,
      };
    }
  }

  // Fetch user data for personal branding
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, settings: true },
  });

  const userBranding = {
    userName: user?.name || 'Athlete',
    userAvatar: user?.settings?.avatar || null,
  };

  // Define file paths
  const filename = `${shareId}.png`;
  const filepath = path.join(UPLOAD_DIR, filename);
  const url = `/uploads/share-cards/${filename}`;

  // Call Python rendering service
  try {
    const response = await axios.post(
      `${PYTHON_SERVICE_URL}/generate`,
      {
        cardType,
        format,
        workoutData,
        options,
        branding: { ...teamBranding, ...userBranding },
      },
      {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout for rendering
      }
    );

    // Save PNG file
    await fs.writeFile(filepath, response.data);
  } catch (error) {
    console.error('Share card generation failed:', error.message);
    throw new Error(
      error.response?.data?.error || 'Failed to generate share card. Please try again.'
    );
  }

  // Generate title and description for OG tags
  const { title, description } = generateMetadata(cardType, workoutData, athleteName);

  // Calculate expiration (30 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Store in database
  const shareCard = await prisma.shareCard.create({
    data: {
      id: shareId,
      workoutId: workoutId || null,
      userId,
      teamId: teamId || null,
      cardType,
      format,
      filepath,
      url,
      options,
      title,
      description,
      athleteName,
      version: 1,
      expiresAt,
    },
  });

  return {
    shareId: shareCard.id,
    url: shareCard.url,
    publicUrl: `/share/${shareCard.id}`,
  };
}

/**
 * Get share card metadata for public pages
 */
export async function getShareCard(shareId) {
  const shareCard = await prisma.shareCard.findUnique({
    where: { id: shareId },
  });

  if (!shareCard) {
    throw new Error('Share card not found');
  }

  // Check if expired
  if (new Date() > shareCard.expiresAt) {
    throw new Error('Share card has expired');
  }

  return shareCard;
}

/**
 * Delete a share card (verify ownership)
 */
export async function deleteShareCard(shareId, userId) {
  const shareCard = await prisma.shareCard.findUnique({
    where: { id: shareId },
  });

  if (!shareCard) {
    throw new Error('Share card not found');
  }

  // Verify ownership
  if (shareCard.userId !== userId) {
    throw new Error('Unauthorized: You do not own this share card');
  }

  // Delete file
  try {
    await fs.unlink(shareCard.filepath);
  } catch (error) {
    console.error('Failed to delete share card file:', error.message);
    // Continue with DB deletion even if file deletion fails
  }

  // Delete database record
  await prisma.shareCard.delete({
    where: { id: shareId },
  });

  return { success: true };
}

/**
 * Clean up expired share cards (for cron job)
 */
export async function cleanupExpiredCards() {
  const expiredCards = await prisma.shareCard.findMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  let deletedCount = 0;
  let failedCount = 0;

  for (const card of expiredCards) {
    try {
      // Delete file
      await fs.unlink(card.filepath);

      // Delete database record
      await prisma.shareCard.delete({
        where: { id: card.id },
      });

      deletedCount++;
    } catch (error) {
      console.error(`Failed to cleanup share card ${card.id}:`, error.message);
      failedCount++;
    }
  }

  return { deletedCount, failedCount };
}

/**
 * Format tenths-of-seconds pace to MM:SS.T string
 */
function formatPaceTenths(tenths) {
  if (!tenths) return null;
  const totalSeconds = tenths / 10;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toFixed(1).padStart(4, '0')}`;
}

/**
 * Format seconds to HH:MM:SS.T or MM:SS.T string
 */
function formatDuration(seconds) {
  if (!seconds) return null;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${secs.toFixed(1).padStart(4, '0')}`;
  }
  return `${mins}:${secs.toFixed(1).padStart(4, '0')}`;
}

/**
 * Convert Prisma workout to Python-friendly JSON.
 * Includes both raw numeric values and pre-formatted display strings.
 */
function serializeWorkoutForPython(workout) {
  const avgPaceTenths = workout.avgPace ? parseFloat(workout.avgPace) : null;
  const durationSec = workout.durationSeconds ? parseFloat(workout.durationSeconds) : null;
  const rawData = workout.rawData || {};
  const rawWorkout = rawData.workout || {};

  // Determine if this is an interval workout (has rest data)
  const isInterval = (rawData.workout_type || '').toLowerCase().includes('interval');

  // Extract raw interval/split segments for enriching with rest data
  const rawSegments = rawWorkout.intervals || rawWorkout.splits || [];

  return {
    id: workout.id,
    date: workout.date.toISOString(),
    distanceM: workout.distanceM,
    durationSeconds: durationSec,
    avgPaceTenths: avgPaceTenths,
    avgWatts: workout.avgWatts,
    avgHeartRate: workout.avgHeartRate,
    strokeRate: workout.strokeRate,
    calories: workout.calories,
    dragFactor: workout.dragFactor,
    machineType: workout.machineType,
    // Workout classification from C2 API
    workoutType: rawData.workout_type || null,
    rawMachineType: rawData.type || null,
    source: workout.source,
    isInterval,
    // Workout-level rest totals (intervals only)
    totalRestTime: rawData.rest_time || null,
    totalRestDistance: rawData.rest_distance || null,
    strokeCount: rawData.stroke_count || null,
    verified: rawData.verified || false,
    // Pre-formatted display strings for the renderer
    formatted: {
      totalTime: formatDuration(durationSec),
      avgPace: formatPaceTenths(avgPaceTenths),
      distance: workout.distanceM ? `${workout.distanceM.toLocaleString()}m` : null,
    },
    splits:
      workout.splits?.map((split, index) => {
        const splitPaceTenths = split.pace ? parseFloat(split.pace) : null;
        const splitTimeSec = split.timeSeconds ? parseFloat(split.timeSeconds) : null;
        // Enrich with raw C2 data for this segment (rest data, detailed HR)
        const rawSeg = rawSegments[index] || {};
        return {
          splitNumber: split.splitNumber,
          distanceM: split.distanceM,
          timeSeconds: splitTimeSec,
          paceTenths: splitPaceTenths,
          watts: split.watts,
          strokeRate: split.strokeRate,
          heartRate: split.heartRate,
          calories: split.calories,
          // Interval-specific rest data (null for steady-state splits)
          intervalType: rawSeg.type || null,
          restTime: rawSeg.rest_time || null,
          restDistance: rawSeg.rest_distance || null,
          // Detailed HR from raw C2 data
          heartRateMax: rawSeg.heart_rate?.max || null,
          heartRateMin: rawSeg.heart_rate?.min || null,
          heartRateEnding: rawSeg.heart_rate?.ending || null,
          heartRateRest: rawSeg.heart_rate?.rest || null,
          // Pre-formatted
          formatted: {
            time: formatDuration(splitTimeSec),
            pace: formatPaceTenths(splitPaceTenths),
            restTime: rawSeg.rest_time ? formatDuration(rawSeg.rest_time / 10) : null,
          },
        };
      }) || [],
    telemetry: workout.telemetry
      ? {
          timeSeriesS: workout.telemetry.timeSeriesS?.map((t) => parseFloat(t)) || [],
          wattsSeries: workout.telemetry.wattsSeries || [],
          heartRateSeries: workout.telemetry.heartRateSeries || [],
          strokeRateSeries: workout.telemetry.strokeRateSeries || [],
        }
      : null,
    athlete: workout.athlete
      ? {
          firstName: workout.athlete.firstName,
          lastName: workout.athlete.lastName,
        }
      : null,
    inferredPattern: workout.inferredPattern || null,
  };
}

/**
 * Machine label map — matches Python renderer
 */
const MACHINE_LABELS = {
  rower: 'ERG',
  slides: 'DYNAMIC',
  dynamic: 'DYNAMIC',
  skierg: 'SKIERG',
  bike: 'BIKEERG',
  bikerg: 'BIKEERG',
};

/**
 * Format distance for titles: 10000 → "10K", 2000 → "2K", 1169 → "1,169m"
 */
function formatDistanceTitle(meters) {
  if (!meters) return '--';
  if (meters >= 1000 && meters % 1000 === 0) return `${meters / 1000}K`;
  return `${meters.toLocaleString()}m`;
}

/**
 * Format time cleanly for titles, dropping trailing .0
 */
function formatTimeClean(seconds) {
  if (!seconds) return '--:--';
  seconds = parseFloat(seconds);
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const tenths = Math.round((secs % 1) * 10);
  const wholeSecs = Math.floor(secs);

  if (hrs > 0) {
    if (tenths === 0)
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(wholeSecs).padStart(2, '0')}`;
    return `${hrs}:${String(mins).padStart(2, '0')}:${secs.toFixed(1).padStart(4, '0')}`;
  }
  if (tenths === 0) return `${mins}:${String(wholeSecs).padStart(2, '0')}`;
  return `${mins}:${secs.toFixed(1).padStart(4, '0')}`;
}

/**
 * Format rest time (tenths of seconds) for titles: 600→"1:00", 300→":30"
 */
function formatRestTenths(tenths) {
  if (!tenths) return null;
  const totalSeconds = tenths / 10;
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  if (mins > 0) return `${mins}:${String(secs).padStart(2, '0')}`;
  return `:${String(secs).padStart(2, '0')}`;
}

/**
 * Build rest label for title: "/1:00r" or "/~:56r"
 * Excludes last interval's rest (PM5 records cooldown, not real rest).
 */
function buildRestLabel(splits, approx = false) {
  const workSplits = splits.length > 1 ? splits.slice(0, -1) : splits;
  const restTimes = workSplits.map((s) => s.restTime).filter(Boolean);
  if (!restTimes.length) return '';
  const unique = new Set(restTimes);
  if (unique.size === 1) {
    const prefix = approx ? '/~' : '/';
    return `${prefix}${formatRestTenths(restTimes[0])}r`;
  }
  const avg = restTimes.reduce((a, b) => a + b, 0) / restTimes.length;
  return `/~${formatRestTenths(avg)}r`;
}

/**
 * Build workout title in rower language.
 * Mirrors Python build_title() — "7x11:00/1:00r BIKEERG", "10K DYNAMIC", etc.
 */
function buildWorkoutTitle(data) {
  const wtype = data.workoutType || '';
  const machine = (data.rawMachineType || data.machineType || 'rower').toLowerCase();
  const mlabel = MACHINE_LABELS[machine] || 'ERG';
  const splits = data.splits || [];
  const distance = data.distanceM;
  const duration = data.durationSeconds;
  const isIntervalType = wtype.toLowerCase().includes('interval');

  // Check for inferred title from JustRow workouts
  const isJustRow = wtype === 'JustRow' || wtype === 0;
  if (isJustRow && data.inferredPattern?.inferredTitle) {
    return `${data.inferredPattern.inferredTitle} ${mlabel}`;
  }

  // Interval workouts
  if (isIntervalType && splits.length > 0) {
    const n = splits.length;

    if (wtype === 'FixedDistanceInterval') {
      const distances = splits.map((s) => s.distanceM).filter(Boolean);
      if (distances.length && new Set(distances).size === 1) {
        const rest = buildRestLabel(splits);
        return `${n}x${formatDistanceTitle(distances[0])}${rest} ${mlabel}`;
      }
    }

    if (wtype === 'FixedTimeInterval') {
      const times = splits.map((s) => s.timeSeconds).filter(Boolean);
      const roundedTimes = times.map((t) => Math.round(parseFloat(t)));
      if (times.length && new Set(roundedTimes).size === 1) {
        const rest = buildRestLabel(splits);
        return `${n}x${formatTimeClean(times[0])}${rest} ${mlabel}`;
      }
    }

    if (wtype === 'VariableInterval' || wtype === 'VariableIntervalUndefinedRest') {
      const distances = splits.map((s) => s.distanceM).filter(Boolean);
      if (distances.length && new Set(distances).size === 1) {
        const rest = buildRestLabel(splits, true);
        return `${n}x${formatDistanceTitle(distances[0])}${rest} ${mlabel}`;
      }
      return `${n} pieces ${mlabel}`;
    }

    const rest = buildRestLabel(splits);
    return `${n} intervals${rest} ${mlabel}`;
  }

  // Continuous pieces
  if (wtype === 'FixedTimeSplits') return `${formatTimeClean(duration)} ${mlabel}`;
  if (wtype === 'FixedDistanceSplits') return `${formatDistanceTitle(distance)} ${mlabel}`;
  if (distance) return `${formatDistanceTitle(distance)} ${mlabel}`;
  if (duration) return `${formatTimeClean(duration)} ${mlabel}`;
  return mlabel;
}

/**
 * Build a description line for OG metadata: pace, watts, HR
 */
function buildWorkoutDescription(data) {
  const machine = (data.rawMachineType || data.machineType || 'rower').toLowerCase();
  const isBike = machine === 'bike' || machine === 'bikerg';
  const paceUnit = isBike ? '/1000m' : '/500m';
  const rateLabel = isBike ? 'rpm' : 'spm';

  const parts = [];
  if (data.avgPaceTenths) {
    // Adjust pace for bike display
    const displayTenths = isBike ? data.avgPaceTenths * 2 : data.avgPaceTenths;
    parts.push(`${formatPaceTenths(displayTenths)}${paceUnit}`);
  }
  if (data.avgWatts) parts.push(`${data.avgWatts}W`);
  if (data.strokeRate) parts.push(`${data.strokeRate} ${rateLabel}`);
  if (data.avgHeartRate) parts.push(`${data.avgHeartRate} bpm`);
  return parts.join(' | ') || 'Rowing workout';
}

/**
 * Generate metadata for OG tags based on card type
 */
function generateMetadata(cardType, workoutData, athleteName) {
  const athlete = athleteName || 'Athlete';

  switch (cardType) {
    case 'erg_summary':
    case 'erg_summary_alt': {
      const title = buildWorkoutTitle(workoutData);
      const description = buildWorkoutDescription(workoutData);
      return { title: `${athlete} — ${title}`, description };
    }

    case 'erg_charts':
      return {
        title: `${athlete}'s Workout Analysis`,
        description: `${buildWorkoutTitle(workoutData)} with detailed split and power charts`,
      };

    case 'pr_celebration':
      return {
        title: `${athlete} Set a New PR!`,
        description: `New personal record achieved`,
      };

    case 'regatta_result':
      return {
        title: 'Regatta Race Result',
        description: 'Race performance summary',
      };

    case 'season_recap':
      return {
        title: `${athlete}'s Season Recap`,
        description: 'Season performance highlights',
      };

    case 'team_leaderboard':
      return {
        title: 'Team Leaderboard',
        description: 'Current team rankings',
      };

    default:
      return {
        title: 'Rowing Performance',
        description: 'oarbit workout share',
      };
  }
}

/**
 * Format pace (tenths of seconds per 500m) as MM:SS.T for metadata
 */
function formatPace(paceTenths) {
  if (!paceTenths) return '--:--';
  return formatPaceTenths(parseFloat(paceTenths)) || '--:--';
}
