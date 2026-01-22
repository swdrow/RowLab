/**
 * Safe API response handler
 *
 * Handles the common pattern of checking response status and parsing JSON safely.
 * Prevents "Unexpected token '<'" errors when server returns HTML error pages.
 *
 * @param {Response} res - Fetch Response object
 * @param {string} defaultError - Default error message if none provided
 * @returns {Promise<any>} Parsed JSON data
 * @throws {Error} If response is not ok or cannot be parsed
 */
export async function handleApiResponse(res, defaultError = 'Request failed') {
  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    // Try to extract error message from JSON response
    if (contentType.includes('application/json')) {
      try {
        const errorData = await res.json();
        throw new Error(
          errorData.error?.message ||
          errorData.message ||
          `${defaultError}: ${res.status}`
        );
      } catch (e) {
        if (e.message.includes('Unexpected token')) {
          throw new Error(`${defaultError}: ${res.status} ${res.statusText}`);
        }
        throw e;
      }
    }
    // Non-JSON error response (HTML error page, etc.)
    throw new Error(`${defaultError}: ${res.status} ${res.statusText}`);
  }

  // Response is OK - parse based on content type
  if (contentType.includes('application/json')) {
    return res.json();
  }

  // Non-JSON success response - return as text or empty object
  const text = await res.text();
  // Try to parse as JSON anyway (some servers don't set content-type correctly)
  try {
    return JSON.parse(text);
  } catch {
    // Return text wrapped in data object for consistency
    return { success: true, data: text };
  }
}

/**
 * Safe JSON parse that doesn't throw on HTML/invalid responses
 *
 * @param {Response} res - Fetch Response object
 * @returns {Promise<{ok: boolean, data?: any, error?: string}>}
 */
export async function safeJsonParse(res) {
  const contentType = res.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    if (!res.ok) {
      return { ok: false, error: `Request failed: ${res.status} ${res.statusText}` };
    }
    // Non-JSON success - could be HTML redirect response
    return { ok: true, data: null, isHtml: contentType.includes('text/html') };
  }

  try {
    const data = await res.json();
    return { ok: res.ok, data, error: data.error?.message };
  } catch (e) {
    return { ok: false, error: `Failed to parse response: ${e.message}` };
  }
}
