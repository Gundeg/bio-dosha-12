import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

/**
 * Application-level encryption for sensitive database fields (AES-256-GCM).
 *
 * Stored format:  "enc:v1:" + base64(iv[12] | authTag[16] | ciphertext)
 * JSON values:    "encj:v1:" + same, decrypted back to the original JSON value.
 *
 * The key comes from ENCRYPTION_KEY: 32 random bytes, base64-encoded.
 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 *
 * Fail closed: without a valid key, encrypting or decrypting throws instead of
 * silently storing or returning plaintext. Values written before encryption was
 * introduced (no prefix) are returned unchanged so old rows keep working.
 */

const PREFIX = "enc:v1:";
const JSON_PREFIX = "encj:v1:";
const IV_BYTES = 12;
const TAG_BYTES = 16;

export class EncryptionKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EncryptionKeyError";
  }
}

let cachedKey: { raw: string; key: Buffer } | null = null;

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new EncryptionKeyError(
      "ENCRYPTION_KEY is not set. Sensitive fields cannot be read or written."
    );
  }
  if (cachedKey?.raw === raw) return cachedKey.key;
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new EncryptionKeyError("ENCRYPTION_KEY must be 32 bytes, base64-encoded.");
  }
  cachedKey = { raw, key };
  return key;
}

/**
 * A separate 32-byte key for another purpose (e.g. keyed hashes), derived
 * from ENCRYPTION_KEY so no second secret has to be managed. Distinct
 * `purpose` strings give unrelated keys.
 */
export function deriveKey(purpose: string): Buffer {
  return createHmac("sha256", getKey()).update(`bio-dosha-12:${purpose}`).digest();
}

/** Reports whether a usable key is configured (used by the system health page). */
export function encryptionKeyStatus(): "ok" | "missing" | "invalid" {
  try {
    getKey();
    return "ok";
  } catch {
    return process.env.ENCRYPTION_KEY ? "invalid" : "missing";
  }
}

function seal(plain: string): string {
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

function open(payload: string): string {
  const key = getKey();
  const buf = Buffer.from(payload, "base64");
  if (buf.length < IV_BYTES + TAG_BYTES) throw new Error("Encrypted value is truncated.");
  const iv = buf.subarray(0, IV_BYTES);
  const tag = buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = buf.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function isEncrypted(value: unknown): value is string {
  return typeof value === "string" && (value.startsWith(PREFIX) || value.startsWith(JSON_PREFIX));
}

/** Encrypts a string. Empty strings are kept as-is (nothing to protect). */
export function encryptString(plain: string): string {
  if (plain === "" || isEncrypted(plain)) return plain;
  return PREFIX + seal(plain);
}

/** Encrypts any JSON value (object, array, number, …) into a string. */
export function encryptJson(value: unknown): string {
  return JSON_PREFIX + seal(JSON.stringify(value));
}

/**
 * Decrypts a value produced by encryptString / encryptJson. Anything that is
 * not an encrypted string (legacy plaintext, numbers, null) is returned as-is.
 */
export function decryptValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  if (value.startsWith(PREFIX)) return open(value.slice(PREFIX.length));
  if (value.startsWith(JSON_PREFIX)) return JSON.parse(open(value.slice(JSON_PREFIX.length)));
  return value;
}
