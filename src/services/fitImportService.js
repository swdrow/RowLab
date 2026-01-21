/**
 * FIT Import Service (Frontend)
 *
 * Handles uploading and importing Garmin .FIT files
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1';

/**
 * Import multiple FIT files as workouts
 * @param {File[]} files - Array of File objects
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Import results
 */
export async function importFitFiles(files, options = {}) {
  const token = localStorage.getItem('accessToken');
  const formData = new FormData();

  // Add files to form data
  files.forEach((file) => {
    formData.append('files', file);
  });

  // Add options
  if (options.athleteId) {
    formData.append('athleteId', options.athleteId);
  }

  const response = await fetch(`${API_URL}/fit/import`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Import failed');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Preview a FIT file without importing
 * @param {File} file - File object
 * @returns {Promise<Object>} Preview data
 */
export async function previewFitFile(file) {
  const token = localStorage.getItem('accessToken');
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/fit/preview`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Preview failed');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Get supported workout types
 * @returns {Promise<Object>} Supported types and devices
 */
export async function getSupportedTypes() {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_URL}/fit/supported-types`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get supported types');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Format duration in seconds to human readable string
 */
export function formatDuration(seconds) {
  if (!seconds) return '--';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format distance in meters to human readable string
 */
export function formatDistance(meters) {
  if (!meters) return '--';
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Format workout type for display
 */
export function formatWorkoutType(type) {
  const typeMap = {
    row: 'Rowing',
    erg: 'Ergometer',
    run: 'Running',
    bike: 'Cycling',
    swim: 'Swimming',
    walk: 'Walking',
    hike: 'Hiking',
    strength: 'Strength',
    cross_train: 'Cross Training',
    paddle: 'Paddling',
  };
  return typeMap[type] || type;
}

export default {
  importFitFiles,
  previewFitFile,
  getSupportedTypes,
  formatDuration,
  formatDistance,
  formatWorkoutType,
};
