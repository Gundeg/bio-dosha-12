import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { deriveKey } from "./crypto/fieldEncryption";

/**
 * Time-based one-time passwords (RFC 6238, SHA-1, 6 digits, 30-second steps),
 * compatible with Google Authenticator, Microsoft Authenticator, 1Password, etc.
 * Implemented on node:crypto to avoid an extra dependency for a security path.
 */

const STEP_SECONDS = 30;
const DIGITS = 6;
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) throw new Error("Invalid base32 character");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** 160-bit random secret, base32-encoded (what authenticator apps expect). */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** HOTP (RFC 4226) for a given counter. */
export function hotp(secret: Buffer, counter: number, digits = DIGITS): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", secret).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 10 ** digits).padStart(digits, "0");
}

export function totpAt(secretBase32: string, timeMs: number, digits = DIGITS): string {
  return hotp(base32Decode(secretBase32), Math.floor(timeMs / 1000 / STEP_SECONDS), digits);
}

/**
 * Checks a code, accepting one step of clock drift either way.
 * Returns the matched step so callers can refuse to accept the same code twice.
 */
export function verifyTotp(secretBase32: string, code: string, nowMs = Date.now()): number | null {
  const clean = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return null;
  const secret = base32Decode(secretBase32);
  const current = Math.floor(nowMs / 1000 / STEP_SECONDS);
  for (const step of [current - 1, current, current + 1]) {
    const expected = Buffer.from(hotp(secret, step));
    const given = Buffer.from(clean);
    if (expected.length === given.length && timingSafeEqual(expected, given)) return step;
  }
  return null;
}

export function otpauthUrl(secretBase32: string, accountLabel: string, issuer = "Bio-Dosha-12"): string {
  const label = encodeURIComponent(`${issuer}:${accountLabel}`);
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

// ── Recovery codes ───────────────────────────────────────────────────────────

const RECOVERY_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L

function randomRecoveryChunk(length: number): string {
  // randomInt is uniform (no modulo bias over the 31-character alphabet).
  let out = "";
  for (let i = 0; i < length; i++) out += RECOVERY_ALPHABET[randomInt(RECOVERY_ALPHABET.length)];
  return out;
}

export function normalizeRecoveryCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Keyed hash (HMAC-SHA256 with a key derived from ENCRYPTION_KEY), so a copy
 * of the database alone is not enough to brute-force recovery codes.
 */
export function hashRecoveryCode(code: string): string {
  return createHmac("sha256", deriveKey("recovery-codes:v1")).update(normalizeRecoveryCode(code)).digest("hex");
}

/** Ten single-use codes like "K7QM-2XPR-9TBW". Show once; store only hashes. */
export function generateRecoveryCodes(count = 10): { codes: string[]; hashes: string[] } {
  const codes = Array.from({ length: count }, () =>
    [randomRecoveryChunk(4), randomRecoveryChunk(4), randomRecoveryChunk(4)].join("-")
  );
  return { codes, hashes: codes.map(hashRecoveryCode) };
}

/** Returns the remaining hashes if the code matched, or null. */
export function consumeRecoveryCode(code: string, hashes: string[]): string[] | null {
  const target = hashRecoveryCode(code);
  const idx = hashes.findIndex((h) => {
    const a = Buffer.from(h, "hex");
    const b = Buffer.from(target, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  });
  if (idx === -1) return null;
  return [...hashes.slice(0, idx), ...hashes.slice(idx + 1)];
}

export function looksLikeRecoveryCode(code: string): boolean {
  return normalizeRecoveryCode(code).length === 12;
}
