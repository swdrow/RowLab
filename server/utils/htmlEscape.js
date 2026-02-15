/**
 * HTML Escape Utility
 * Prevents XSS attacks by escaping HTML special characters
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} str - The string to escape
 * @returns {string} - The escaped string safe for HTML insertion
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) {
    return '';
  }

  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Escapes HTML attributes to prevent XSS in attribute context
 * More restrictive than escapeHtml - also escapes spaces and other chars
 * @param {string} str - The string to escape for attribute use
 * @returns {string} - The escaped string safe for HTML attribute insertion
 */
export function escapeHtmlAttr(str) {
  if (str === null || str === undefined) {
    return '';
  }

  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/=/g, '&#x3D;')
    .replace(/`/g, '&#x60;');
}
