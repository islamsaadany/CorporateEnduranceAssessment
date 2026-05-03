/**
 * AES-256-GCM helpers for encrypting AI provider API keys at rest.
 *
 * Master key: 32 bytes, base64-encoded in `SETTINGS_ENCRYPTION_KEY`.
 * Wire format on disk: `iv (12) || authTag (16) || ciphertext (n)` — a single
 * Buffer stored in the relevant `Settings.encryptedApiKey*` Bytes column.
 *
 * The key is read once per call rather than memoized so that key rotation
 * (which the user must do post-deploy per progress.md § 4) takes effect
 * without a process restart in dev. In prod, Vercel reboots on env change.
 */

import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16
const KEY_LENGTH = 32

function getMasterKey(): Buffer {
  const raw = process.env.SETTINGS_ENCRYPTION_KEY
  if (!raw) {
    throw new Error(
      'SETTINGS_ENCRYPTION_KEY is not set. Generate with: openssl rand -base64 32',
    )
  }
  const key = Buffer.from(raw, 'base64')
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `SETTINGS_ENCRYPTION_KEY must decode to exactly ${KEY_LENGTH} bytes (got ${key.length}). Regenerate with: openssl rand -base64 32`,
    )
  }
  return key
}

export function encryptSecret(plaintext: string): Buffer {
  if (!plaintext) {
    throw new Error('encryptSecret: plaintext must be non-empty')
  }
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, getMasterKey(), iv)
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, ciphertext])
}

export function decryptSecret(stored: Buffer): string {
  if (stored.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error('decryptSecret: stored buffer is too short')
  }
  const iv = stored.subarray(0, IV_LENGTH)
  const authTag = stored.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = stored.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
  const decipher = createDecipheriv(ALGORITHM, getMasterKey(), iv)
  decipher.setAuthTag(authTag)
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])
  return plaintext.toString('utf8')
}

/**
 * Returns the last 4 chars of a saved (encrypted) key, for masked display.
 * Returns null if decryption fails — surfaces gracefully as "no key" in UI
 * rather than crashing the page (e.g., after a SETTINGS_ENCRYPTION_KEY
 * rotation orphans previously-encrypted rows).
 */
export function lastFourOf(stored: Buffer | null | undefined): string | null {
  if (!stored || stored.length === 0) return null
  try {
    const plaintext = decryptSecret(stored)
    return plaintext.slice(-4)
  } catch {
    return null
  }
}
