import crypto from 'crypto';

/**
 * AES-256-GCM Encryption Utility
 * Used for encrypting sensitive data like OAuth tokens at rest
 *
 * Security features:
 * - AES-256-GCM authenticated encryption
 * - Random IV per encryption
 * - Authentication tag prevents tampering
 * - Base64 encoding for safe storage
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM recommended IV length
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment
 * Key must be 32 bytes (256 bits) hex-encoded (64 chars)
 * @returns {Buffer} encryption key
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }

  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encrypt plaintext using AES-256-GCM
 * @param {string} plaintext - text to encrypt
 * @returns {string} base64-encoded ciphertext (iv:authTag:ciphertext)
 */
export function encrypt(plaintext) {
  if (!plaintext) return null;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext (all base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt ciphertext using AES-256-GCM
 * @param {string} ciphertext - base64-encoded ciphertext (iv:authTag:ciphertext)
 * @returns {string|null} decrypted plaintext or null if decryption fails
 */
export function decrypt(ciphertext) {
  if (!ciphertext) return null;

  try {
    const key = getEncryptionKey();

    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      // Not in expected format - might be plaintext (legacy data)
      return null;
    }

    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = parts[2];

    // Validate IV length
    if (iv.length !== IV_LENGTH) {
      return null;
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    // Re-throw errors related to missing encryption key
    if (err.message?.includes('ENCRYPTION_KEY')) {
      throw err;
    }
    // Decryption failed - likely plaintext or corrupted data
    return null;
  }
}

/**
 * Check if a string appears to be encrypted (has expected format)
 * @param {string} value - value to check
 * @returns {boolean} true if value appears encrypted
 */
export function isEncrypted(value) {
  if (!value || typeof value !== 'string') return false;

  const parts = value.split(':');
  if (parts.length !== 3) return false;

  // Check if parts are valid base64
  try {
    const iv = Buffer.from(parts[0], 'base64');
    return iv.length === IV_LENGTH;
  } catch {
    return false;
  }
}

/**
 * Verify HMAC signature for webhooks
 * @param {string} payload - raw webhook payload
 * @param {string} signature - signature from webhook header
 * @param {string} secret - shared secret
 * @returns {boolean} true if signature is valid
 */
export function verifyHmacSignature(payload, signature, secret) {
  if (!payload || !signature || !secret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Generate a secure random key (for initial setup)
 * @returns {string} 64-char hex string suitable for ENCRYPTION_KEY
 */
export function generateKey() {
  return crypto.randomBytes(32).toString('hex');
}

export default {
  encrypt,
  decrypt,
  isEncrypted,
  verifyHmacSignature,
  generateKey,
};
