import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  EncryptionKeyError,
  decryptValue,
  encryptJson,
  encryptString,
  encryptionKeyStatus,
  isEncrypted,
} from "../crypto/fieldEncryption";
import { EncryptionWriteError, decryptResult, encryptWriteArgs } from "../crypto/encryptedFields";

const KEY_A = randomBytes(32).toString("base64");
const KEY_B = randomBytes(32).toString("base64");
const JSON_NULL = Symbol("JsonNull");
const isJsonNull = (v: unknown) => v === JSON_NULL;

let savedKey: string | undefined;
beforeEach(() => {
  savedKey = process.env.ENCRYPTION_KEY;
  process.env.ENCRYPTION_KEY = KEY_A;
});
afterEach(() => {
  if (savedKey === undefined) delete process.env.ENCRYPTION_KEY;
  else process.env.ENCRYPTION_KEY = savedKey;
});

describe("field encryption (AES-256-GCM)", () => {
  it("round-trips text, including Mongolian", () => {
    const enc = encryptString("Хий хөдөлсөн, 99112233");
    expect(enc.startsWith("enc:v1:")).toBe(true);
    expect(enc).not.toContain("99112233");
    expect(decryptValue(enc)).toBe("Хий хөдөлсөн, 99112233");
  });

  it("uses a fresh IV each time", () => {
    expect(encryptString("same")).not.toBe(encryptString("same"));
  });

  it("round-trips JSON values", () => {
    const value = { dolovor: { rightTop: "x" }, list: [1, 2] };
    const enc = encryptJson(value);
    expect(enc.startsWith("encj:v1:")).toBe(true);
    expect(decryptValue(enc)).toEqual(value);
  });

  it("leaves legacy plaintext, empty strings and non-strings alone", () => {
    expect(decryptValue("old plaintext")).toBe("old plaintext");
    expect(encryptString("")).toBe("");
    expect(decryptValue(42)).toBe(42);
    expect(decryptValue(null)).toBeNull();
  });

  it("fails closed when the ciphertext was tampered with", () => {
    const enc = encryptString("secret");
    const raw = Buffer.from(enc.slice("enc:v1:".length), "base64");
    raw[raw.length - 1] ^= 0x01;
    expect(() => decryptValue("enc:v1:" + raw.toString("base64"))).toThrow();
  });

  it("fails closed with a different key", () => {
    const enc = encryptString("secret");
    process.env.ENCRYPTION_KEY = KEY_B;
    expect(() => decryptValue(enc)).toThrow();
  });

  it("refuses to work without a valid key", () => {
    delete process.env.ENCRYPTION_KEY;
    expect(encryptionKeyStatus()).toBe("missing");
    expect(() => encryptString("x")).toThrow(EncryptionKeyError);
    process.env.ENCRYPTION_KEY = Buffer.from("short").toString("base64");
    expect(encryptionKeyStatus()).toBe("invalid");
    expect(() => encryptString("x")).toThrow(EncryptionKeyError);
    process.env.ENCRYPTION_KEY = KEY_A;
    expect(encryptionKeyStatus()).toBe("ok");
  });
});

describe("encryptWriteArgs (Prisma writes)", () => {
  it("encrypts sensitive fields and leaves the rest readable", () => {
    const args = encryptWriteArgs("Profile", "create", {
      data: { name: "Patient X", phone: "99112233", address: "Хан-Уул", heightCm: 160 },
    }) as { data: Record<string, unknown> };
    expect(args.data.name).toBe("Patient X");
    expect(args.data.heightCm).toBe(160);
    expect(isEncrypted(args.data.phone)).toBe(true);
    expect(isEncrypted(args.data.address)).toBe(true);
    expect(decryptValue(args.data.phone)).toBe("99112233");
  });

  it("covers update {set}, upsert, updateMany and createMany", () => {
    const upd = encryptWriteArgs("Patient", "update", { where: { id: "1" }, data: { clinicalNotes: { set: "note" } } }) as {
      data: { clinicalNotes: { set: string } };
    };
    expect(isEncrypted(upd.data.clinicalNotes.set)).toBe(true);

    const ups = encryptWriteArgs("BEDIRecord", "upsert", {
      where: { id: "1" },
      create: { notes: "a" },
      update: { notes: "b" },
    }) as { create: { notes: string }; update: { notes: string } };
    expect(decryptValue(ups.create.notes)).toBe("a");
    expect(decryptValue(ups.update.notes)).toBe("b");

    const many = encryptWriteArgs("ClinicalIntake", "createMany", {
      data: [{ diagnosis: "d1" }, { diagnosis: "d2" }],
    }) as { data: { diagnosis: string }[] };
    expect(many.data.map((d) => decryptValue(d.diagnosis))).toEqual(["d1", "d2"]);

    const um = encryptWriteArgs("ClinicalIntake", "updateMany", { where: {}, data: { tongue: "t" } }) as {
      data: { tongue: string };
    };
    expect(isEncrypted(um.data.tongue)).toBe(true);
  });

  it("encrypts JSON fields but keeps JSON null sentinels", () => {
    const a = encryptWriteArgs("ClinicalIntake", "create", { data: { pulseTable: { dolovor: {} } } }, isJsonNull) as {
      data: { pulseTable: unknown };
    };
    expect(isEncrypted(a.data.pulseTable)).toBe(true);
    const b = encryptWriteArgs("ClinicalIntake", "update", { where: { id: "1" }, data: { pulseTable: JSON_NULL } }, isJsonNull) as {
      data: { pulseTable: unknown };
    };
    expect(b.data.pulseTable).toBe(JSON_NULL);
  });

  it("rejects values that only look encrypted in other fields", () => {
    expect(() =>
      encryptWriteArgs("Profile", "create", { data: { name: "enc:v1:AAAA", phone: "1" } })
    ).toThrow(EncryptionWriteError);
    expect(() =>
      encryptWriteArgs("Organization", "update", { where: { id: "1" }, data: { city: "encj:v1:xyz" } })
    ).toThrow(EncryptionWriteError);
  });

  it("still encrypts a sensitive value that starts with the prefix, and returns it intact", () => {
    const args = encryptWriteArgs("Profile", "create", { data: { phone: "enc:v1:not-really" } }) as {
      data: { phone: string };
    };
    expect(decryptValue(args.data.phone)).toBe("enc:v1:not-really");
  });

  it("refuses nested writes of sensitive fields (they would bypass encryption)", () => {
    expect(() =>
      encryptWriteArgs("Patient", "create", {
        data: { profile: { create: { name: "x", phone: "99112233" } } },
      })
    ).toThrow(EncryptionWriteError);
    // Operator objects inside a relation write are refused too.
    expect(() =>
      encryptWriteArgs("Patient", "update", {
        where: { id: "1" },
        data: { profile: { update: { phone: { set: "99112233" } } } },
      })
    ).toThrow(EncryptionWriteError);
    // Clearing a nested sensitive field is allowed (nothing to protect).
    expect(() =>
      encryptWriteArgs("Patient", "update", { where: { id: "1" }, data: { profile: { update: { phone: null } } } })
    ).not.toThrow();
  });

  it("does not touch reads", () => {
    const args = { where: { phone: "99112233" } };
    expect(encryptWriteArgs("Profile", "findMany", args)).toBe(args);
  });
});

describe("decryptResult (Prisma reads)", () => {
  it("decrypts nested results and keeps dates and numbers", () => {
    const at = new Date("2026-10-27T00:00:00Z");
    const result = decryptResult([
      {
        id: "p1",
        createdAt: at,
        heightCm: 170,
        phone: encryptString("99112233"),
        bediRecords: [{ notes: encryptString("n1") }],
        intake: { pulseTable: encryptJson({ a: 1 }) },
      },
    ]);
    expect(result[0].phone).toBe("99112233");
    expect(result[0].bediRecords[0].notes).toBe("n1");
    expect(result[0].intake.pulseTable).toEqual({ a: 1 });
    expect(result[0].createdAt).toBe(at);
    expect(result[0].heightCm).toBe(170);
  });
});
