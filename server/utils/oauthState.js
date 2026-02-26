import crypto from 'crypto';

/**
 * HMAC-SHA256 signed OAuth state parameters for CSRF protection.
 *
 * State is signed with JWT_SECRET to prevent forged state in OAuth callbacks.
 * Uses timing-safe comparison and base64url encoding for URL safety.
 */

/**
 * Create an HMAC-SHA256 signed OAuth state parameter.
 * Signs the payload with JWT_SECRET to prevent CSRF via forged state.
 * @param {object} data - Payload to sign (e.g. { userId })
 * @returns {string} base64url-encoded signed state
 */
export function createSignedOAuthState(data) {
  const payload = JSON.stringify({ ...data, timestamp: Date.now() });
  const signature = crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(payload)
    .digest('hex');
  return Buffer.from(`${payload}.${signature}`).toString('base64url');
}

/**
 * Verify and decode an HMAC-SHA256 signed OAuth state parameter.
 * Throws if signature is invalid or state is expired (default 10 min).
 * @param {string} state - base64url-encoded signed state
 * @param {number} [maxAgeMs=600000] - Maximum age in milliseconds (default 10 min)
 * @returns {object} Decoded payload
 */
export function verifyOAuthState(state, maxAgeMs = 10 * 60 * 1000) {
  const decoded = Buffer.from(state, 'base64url').toString();
  const dotIndex = decoded.lastIndexOf('.');
  if (dotIndex === -1) throw new Error('Invalid state format');

  const payload = decoded.substring(0, dotIndex);
  const signature = decoded.substring(dotIndex + 1);

  const expected = crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(payload)
    .digest('hex');

  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    throw new Error('State signature verification failed');
  }

  const data = JSON.parse(payload);

  if (Date.now() - data.timestamp > maxAgeMs) {
    throw new Error('OAuth state parameter expired');
  }

  return data;
}
