/**
 * Shared error handling utilities
 */

/**
 * Extract error message from various error formats
 * @param {string|Error|{error?: string, message?: string}} error - The error to extract message from
 * @param {string} fallback - Default message if extraction fails
 * @returns {string} The extracted error message
 */
export function getErrorMessage(error, fallback = 'An unexpected error occurred') {
  if (typeof error === 'string') {
    return error;
  }
  if (error?.message) {
    return error.message;
  }
  if (error?.error) {
    return error.error;
  }
  return fallback;
}

/**
 * Create a standardized API error response
 * @param {Response} response - Fetch response object
 * @param {string} fallback - Default message if extraction fails
 * @returns {Promise<string>} The error message
 */
export async function getApiErrorMessage(response, fallback = 'Request failed') {
  try {
    const data = await response.json();
    return getErrorMessage(data, fallback);
  } catch {
    return fallback;
  }
}
