import { decryptValue, encryptJson, encryptString, isEncrypted } from "./fieldEncryption";

/**
 * Which columns are encrypted at rest. Model names match Prisma's model names.
 * Names, birth dates, heights and BEDI numbers stay plaintext: they are needed
 * for calculations, sorting and search.
 */
export const ENCRYPTED_FIELDS: Readonly<Record<string, readonly string[]>> = {
  User: ["totpSecret"],
  Profile: ["registerNumber", "phone", "address"],
  Patient: ["clinicalNotes"],
  BEDIRecord: ["notes"],
  ClinicalIntake: [
    "tongue",
    "pulseSummary",
    "complaintAtArrival",
    "condition",
    "mentalState",
    "position",
    "zurkhai",
    "diagnosis",
    "treatmentPlan",
    "covidHistory",
    "surgeryHistory",
    "chronicDisease",
    "traumaHistory",
    "bloodPressure",
    "heartRate",
    "complaintAtDischarge",
    "recommendations",
  ],
};

/** JSON columns encrypted as a whole. */
export const ENCRYPTED_JSON_FIELDS: Readonly<Record<string, readonly string[]>> = {
  ClinicalIntake: ["pulseTable"],
};

const ALL_ENCRYPTED_NAMES = new Set(
  [...Object.values(ENCRYPTED_FIELDS), ...Object.values(ENCRYPTED_JSON_FIELDS)].flat()
);

const WRITE_OPERATIONS = new Set([
  "create",
  "createMany",
  "createManyAndReturn",
  "update",
  "updateMany",
  "updateManyAndReturn",
  "upsert",
]);

export class EncryptionWriteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EncryptionWriteError";
  }
}

type Data = Record<string, unknown>;
type IsJsonNull = (value: unknown) => boolean;

function isPlainObject(value: unknown): value is Data {
  return !!value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype;
}

/** Rejects values that only look encrypted, so stored ciphertext is always ours. */
function rejectForgedCiphertext(value: unknown, path: string, depth: number): void {
  if (typeof value === "string") {
    if (isEncrypted(value)) {
      throw new EncryptionWriteError(`Value for "${path}" uses the reserved encryption prefix.`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => rejectForgedCiphertext(v, `${path}[${i}]`, depth));
    return;
  }
  if (isPlainObject(value)) {
    for (const [key, v] of Object.entries(value)) {
      if (depth > 0 && ALL_ENCRYPTED_NAMES.has(key) && v !== null && v !== undefined) {
        // Nested writes bypass per-model encryption (including operator objects
        // such as { set: "..." }); refuse instead of storing plaintext.
        throw new EncryptionWriteError(
          `Nested write of "${key}" is not supported; write the sensitive model directly.`
        );
      }
      rejectForgedCiphertext(v, `${path}.${key}`, depth + 1);
    }
  }
}

function encryptData(model: string, data: Data, isJsonNull: IsJsonNull): Data {
  const fields = ENCRYPTED_FIELDS[model] ?? [];
  const jsonFields = ENCRYPTED_JSON_FIELDS[model] ?? [];
  const out: Data = { ...data };

  for (const [key, value] of Object.entries(out)) {
    if (fields.includes(key) || jsonFields.includes(key)) continue;
    rejectForgedCiphertext(value, `${model}.${key}`, 0);
  }

  for (const field of fields) {
    const value = out[field];
    if (typeof value === "string") {
      // Always encrypt, even if the input already looks encrypted.
      out[field] = value === "" ? "" : encryptStringAlways(value);
    } else if (isPlainObject(value) && typeof value.set === "string") {
      out[field] = { ...value, set: value.set === "" ? "" : encryptStringAlways(value.set) };
    }
  }

  for (const field of jsonFields) {
    const value = out[field];
    if (value === undefined || value === null || isJsonNull(value)) continue;
    out[field] = encryptJson(value);
  }

  return out;
}

function encryptStringAlways(value: string): string {
  // encryptString skips values that already carry the prefix; for user input we
  // never want that shortcut, so wrap such values to encrypt them as data.
  return isEncrypted(value) ? encryptJson(value) : encryptString(value);
}

/** Returns args with sensitive fields encrypted for write operations. */
export function encryptWriteArgs(
  model: string,
  operation: string,
  args: unknown,
  isJsonNull: IsJsonNull = () => false
): unknown {
  if (!WRITE_OPERATIONS.has(operation) || !isPlainObject(args)) return args;
  const next: Data = { ...args };

  const transform = (data: unknown) => {
    if (Array.isArray(data)) return data.map((d) => (isPlainObject(d) ? encryptData(model, d, isJsonNull) : d));
    if (isPlainObject(data)) return encryptData(model, data, isJsonNull);
    return data;
  };

  if (operation === "upsert") {
    next.create = transform(next.create);
    next.update = transform(next.update);
  } else {
    next.data = transform(next.data);
  }
  return next;
}

/**
 * Decrypts every encrypted string in a query result, including nested
 * includes. Fails closed: a tampered value or a wrong key throws.
 */
export function decryptResult<T>(value: T): T {
  if (typeof value === "string") return (isEncrypted(value) ? decryptValue(value) : value) as T;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) value[i] = decryptResult(value[i]);
    return value;
  }
  if (isPlainObject(value)) {
    const obj: Data = value;
    for (const key of Object.keys(obj)) obj[key] = decryptResult(obj[key]);
    return value;
  }
  return value;
}
