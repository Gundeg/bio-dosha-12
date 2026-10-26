import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  base32Decode,
  base32Encode,
  consumeRecoveryCode,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  hotp,
  looksLikeRecoveryCode,
  otpauthUrl,
  totpAt,
  verifyTotp,
} from "../totp";

// RFC 6238 Appendix B, SHA-1 secret "12345678901234567890", 8 digits.
const RFC_SECRET = Buffer.from("12345678901234567890", "ascii");
const RFC_VECTORS: [number, string][] = [
  [59, "94287082"],
  [1111111109, "07081804"],
  [1111111111, "14050471"],
  [1234567890, "89005924"],
  [2000000000, "69279037"],
  [20000000000, "65353130"],
];

describe("TOTP (RFC 6238)", () => {
  it.each(RFC_VECTORS)("matches the RFC vector at T=%i", (t, expected) => {
    expect(hotp(RFC_SECRET, Math.floor(t / 30), 8)).toBe(expected);
  });

  it("produces the 6-digit code authenticator apps show", () => {
    const secret = base32Encode(RFC_SECRET);
    // Last 6 digits of the 8-digit RFC value for T=59.
    expect(totpAt(secret, 59_000)).toBe("287082");
  });

  it("round-trips base32", () => {
    const buf = Buffer.from([0, 1, 2, 250, 251, 252, 253, 254, 255, 17]);
    expect(base32Decode(base32Encode(buf)).equals(buf)).toBe(true);
    expect(base32Decode("gezd gnbv-gy3t qojq").toString("ascii")).toBe("1234567890");
  });

  it("generates 160-bit secrets", () => {
    const s = generateTotpSecret();
    expect(base32Decode(s)).toHaveLength(20);
    expect(generateTotpSecret()).not.toBe(s);
  });

  it("accepts one step of clock drift and returns the matched step", () => {
    const secret = generateTotpSecret();
    const now = 1_800_000_000_000;
    const step = Math.floor(now / 30_000);
    expect(verifyTotp(secret, totpAt(secret, now), now)).toBe(step);
    expect(verifyTotp(secret, totpAt(secret, now - 30_000), now)).toBe(step - 1);
    expect(verifyTotp(secret, totpAt(secret, now + 30_000), now)).toBe(step + 1);
  });

  it("rejects codes two steps away, wrong length or non-digits", () => {
    const secret = generateTotpSecret();
    const now = 1_800_000_000_000;
    expect(verifyTotp(secret, totpAt(secret, now - 60_000), now)).toBeNull();
    expect(verifyTotp(secret, totpAt(secret, now + 60_000), now)).toBeNull();
    expect(verifyTotp(secret, "12345", now)).toBeNull();
    expect(verifyTotp(secret, "12a456", now)).toBeNull();
  });

  it("builds an otpauth URL authenticator apps understand", () => {
    const url = otpauthUrl("JBSWY3DPEHPK3PXP", "doctor@clinic.mn");
    expect(url.startsWith("otpauth://totp/Bio-Dosha-12%3Adoctor%40clinic.mn?")).toBe(true);
    const params = new URL(url).searchParams;
    expect(params.get("secret")).toBe("JBSWY3DPEHPK3PXP");
    expect(params.get("issuer")).toBe("Bio-Dosha-12");
    expect(params.get("period")).toBe("30");
    expect(params.get("digits")).toBe("6");
  });
});

describe("recovery codes", () => {
  // Recovery-code hashes are keyed with a key derived from ENCRYPTION_KEY.
  const saved = process.env.ENCRYPTION_KEY;
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = randomBytes(32).toString("base64");
  });
  afterAll(() => {
    if (saved === undefined) delete process.env.ENCRYPTION_KEY;
    else process.env.ENCRYPTION_KEY = saved;
  });

  it("stores keyed hashes that change with the key", () => {
    const h1 = hashRecoveryCode("K7QM-2XPR-9TBW");
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
    const before = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = randomBytes(32).toString("base64");
    expect(hashRecoveryCode("K7QM-2XPR-9TBW")).not.toBe(h1);
    process.env.ENCRYPTION_KEY = before;
    expect(hashRecoveryCode("k7qm 2xpr 9tbw")).toBe(h1);
  });

  it("creates ten unique codes in the XXXX-XXXX-XXXX format without look-alike characters", () => {
    const { codes, hashes } = generateRecoveryCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    for (const c of codes) expect(c).toMatch(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/);
    expect(hashes).toEqual(codes.map(hashRecoveryCode));
  });

  it("works once, regardless of case and dashes", () => {
    const { codes, hashes } = generateRecoveryCodes(3);
    const typed = codes[1].toLowerCase().replace(/-/g, " ");
    expect(looksLikeRecoveryCode(typed)).toBe(true);
    const remaining = consumeRecoveryCode(typed, hashes);
    expect(remaining).toEqual([hashes[0], hashes[2]]);
    expect(consumeRecoveryCode(codes[1], remaining!)).toBeNull();
  });

  it("does not mistake a 6-digit code for a recovery code", () => {
    expect(looksLikeRecoveryCode("123456")).toBe(false);
  });
});
