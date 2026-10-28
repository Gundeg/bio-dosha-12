/**
 * Encrypts sensitive values that were stored before field encryption was
 * switched on (rows written by older versions of the app). Run it once after
 * deploying with ENCRYPTION_KEY set. It is idempotent: values that are already
 * encrypted are skipped, so it can be re-run safely.
 *
 *   DATABASE_URL=... ENCRYPTION_KEY=... npx tsx scripts/encrypt-existing-data.ts           # count only
 *   DATABASE_URL=... ENCRYPTION_KEY=... npx tsx scripts/encrypt-existing-data.ts --apply   # encrypt
 *
 * Use exactly the same ENCRYPTION_KEY as the deployed site. Save the key in
 * the password manager first: encrypted values cannot be read without it.
 */
import { prisma } from "../src/lib/prisma";
import { encryptionKeyStatus } from "../src/lib/crypto/fieldEncryption";
import { ENCRYPTED_FIELDS, ENCRYPTED_JSON_FIELDS } from "../src/lib/crypto/encryptedFields";

const APPLY = process.argv.includes("--apply");
const BATCH = 200;

type Delegate = {
  update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
};

/** Prisma client delegates by model name (only models with encrypted fields). */
const DELEGATES: Record<string, Delegate> = {
  User: prisma.user as unknown as Delegate,
  Profile: prisma.profile as unknown as Delegate,
  Patient: prisma.patient as unknown as Delegate,
  BEDIRecord: prisma.bEDIRecord as unknown as Delegate,
  ClinicalIntake: prisma.clinicalIntake as unknown as Delegate,
};

/** SQL condition for "still plaintext". Identifiers come from the constant field map, never from input. */
function plaintextCondition(field: string, json: boolean): string {
  const col = `"${field}"`;
  return json
    ? `${col} IS NOT NULL AND ${col} <> 'null'::jsonb AND NOT (jsonb_typeof(${col}) = 'string' AND (${col} #>> '{}') LIKE 'encj:v1:%')`
    : `${col} IS NOT NULL AND ${col} <> '' AND ${col} NOT LIKE 'enc:v1:%' AND ${col} NOT LIKE 'encj:v1:%'`;
}

async function processField(model: string, field: string, json: boolean): Promise<number> {
  const delegate = DELEGATES[model];
  if (!delegate) throw new Error(`No client delegate for model ${model}`);
  const where = plaintextCondition(field, json);

  if (!APPLY) {
    const rows = await prisma.$queryRawUnsafe<{ n: bigint }[]>(`SELECT count(*)::bigint AS n FROM "${model}" WHERE ${where}`);
    return Number(rows[0]?.n ?? 0);
  }

  let total = 0;
  const done = new Set<string>();
  for (;;) {
    const rows = await prisma.$queryRawUnsafe<{ id: string; value: unknown }[]>(
      `SELECT "id", "${field}" AS value FROM "${model}" WHERE ${where} ORDER BY "id" LIMIT ${BATCH}`
    );
    if (!rows.length) break;
    for (const row of rows) {
      // A row that is still plaintext after its update would loop forever.
      if (done.has(row.id)) throw new Error(`${model}.${field} of ${row.id} stayed plaintext after update`);
      done.add(row.id);
      // Writing through the client runs the encryption extension.
      await delegate.update({ where: { id: row.id }, data: { [field]: row.value } });
    }
    total += rows.length;
  }
  return total;
}

async function main() {
  const key = encryptionKeyStatus();
  if (key !== "ok") {
    console.error(`ENCRYPTION_KEY is ${key}. Set it to the same value as the deployed site (32 random bytes, base64).`);
    process.exit(1);
  }

  let grandTotal = 0;
  const work: [string, string, boolean][] = [
    ...Object.entries(ENCRYPTED_FIELDS).flatMap(([m, fs]) => fs.map((f) => [m, f, false] as [string, string, boolean])),
    ...Object.entries(ENCRYPTED_JSON_FIELDS).flatMap(([m, fs]) => fs.map((f) => [m, f, true] as [string, string, boolean])),
  ];
  for (const [model, field, json] of work) {
    const n = await processField(model, field, json);
    grandTotal += n;
    if (n) console.log(`  ${APPLY ? "encrypted" : "plaintext"}  ${model}.${field}: ${n}`);
  }

  if (!grandTotal) {
    console.log("All sensitive values are already encrypted.");
  } else if (APPLY) {
    console.log(`\nDone: ${grandTotal} values encrypted.`);
  } else {
    console.log(`\n${grandTotal} values are stored as plaintext. Re-run with --apply to encrypt them.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
