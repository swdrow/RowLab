import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 20GB storage cap in bytes
const STORAGE_CAP_BYTES = 20 * 1024 * 1024 * 1024;
const WARNING_THRESHOLD = 0.8; // 80%

/**
 * Get the size of a file in bytes
 */
async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (err) {
    return 0;
  }
}

/**
 * Get the size of a directory in bytes (recursive)
 */
async function getDirectorySize(dirPath) {
  try {
    let totalSize = 0;
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        totalSize += await getDirectorySize(fullPath);
      } else {
        totalSize += await getFileSize(fullPath);
      }
    }

    return totalSize;
  } catch (err) {
    return 0;
  }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get storage usage information
 */
export async function getStorageInfo() {
  const dataDir = path.resolve(__dirname, '../../data');
  const headshotsDir = '/home/swd/Rowing/Roster_Headshots_cropped';

  // Calculate sizes
  const dbPath = path.join(dataDir, 'rowlab.db');
  const databaseSize = await getFileSize(dbPath);
  const headshotsSize = await getDirectorySize(headshotsDir);

  const totalUsed = databaseSize + headshotsSize;
  const usagePercent = (totalUsed / STORAGE_CAP_BYTES) * 100;
  const isWarning = usagePercent >= WARNING_THRESHOLD * 100;
  const isAtLimit = usagePercent >= 100;

  return {
    database: {
      path: dbPath,
      size: databaseSize,
      sizeFormatted: formatBytes(databaseSize),
    },
    headshots: {
      path: headshotsDir,
      size: headshotsSize,
      sizeFormatted: formatBytes(headshotsSize),
    },
    total: {
      used: totalUsed,
      usedFormatted: formatBytes(totalUsed),
      cap: STORAGE_CAP_BYTES,
      capFormatted: formatBytes(STORAGE_CAP_BYTES),
      available: Math.max(0, STORAGE_CAP_BYTES - totalUsed),
      availableFormatted: formatBytes(Math.max(0, STORAGE_CAP_BYTES - totalUsed)),
      usagePercent: parseFloat(usagePercent.toFixed(2)),
    },
    status: {
      isWarning,
      isAtLimit,
      message: isAtLimit
        ? 'Storage limit reached! Please free up space.'
        : isWarning
        ? 'Storage usage is high. Consider cleaning up unused data.'
        : 'Storage usage is normal.',
    },
  };
}

/**
 * Check if storage allows new data
 * Returns true if under limit, false if at/over limit
 */
export async function canStore(additionalBytes = 0) {
  const info = await getStorageInfo();
  return info.total.used + additionalBytes < STORAGE_CAP_BYTES;
}

export default { getStorageInfo, canStore };
