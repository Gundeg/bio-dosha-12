/**
 * Recompute stored BEDI records with the engine that is currently deployed.
 *
 * Safe by default:
 *   - Without --apply it only prints what would change (dry run).
 *   - With --apply it first writes a JSON backup of every value it will
 *     overwrite, then updates bedi/deviation/status AND the stored
 *     recommendation inside one transaction.
 *
 *   DATABASE_URL=... npx tsx scripts/recompute-bedi.ts            # preview
 *   DATABASE_URL=... npx tsx scripts/recompute-bedi.ts --apply    # write
 *
 * The backup file contains health data. Keep it out of git (it is ignored by
 * .gitignore) and delete it once the result has been checked.
 */
import { writeFileSync } from "node:fs";
import { prisma } from "../src/lib/prisma";
import { calculateBEDI } from "../src/lib/bediEngine";
import { getRemedies } from "../src/lib/remedyEngine";
import type { DoshaKey } from "../src/lib/ktMapping";
import type { SeasonKey } from "../src/lib/seasonFactors";

const APPLY = process.argv.includes("--apply");

/** Completed years at a given date (the record's own date, not today). */
function ageAt(birthDate: Date, at: Date): number {
  let age = at.getFullYear() - birthDate.getFullYear();
  const m = at.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && at.getDate() < birthDate.getDate())) age--;
  return Math.max(age, 0);
}

async function main() {
  const records = await prisma.bEDIRecord.findMany({
    include: { profile: true, recommendation: true },
    orderBy: { date: "asc" },
  });

  type Change = {
    id: string;
    before: { bedi: number; deviation: number; status: string };
    after: { bedi: number; deviation: number; status: string };
    remedies: ReturnType<typeof getRemedies>;
  };
  const changes: Change[] = [];
  let skipped = 0;

  for (const record of records) {
    const { profile } = record;
    if (!profile?.ktScore) {
      skipped++;
      continue;
    }

    const age = ageAt(profile.birthDate, record.date);
    const result = calculateBEDI({
      weightKg: record.weightKg,
      heightCm: profile.heightCm,
      age,
      sex: profile.sex,
      season: record.season as SeasonKey,
      kt: profile.ktScore,
    });

    if (
      result.bedi === record.bedi &&
      result.deviation === record.deviation &&
      result.status === record.status
    ) {
      skipped++;
      continue;
    }

    changes.push({
      id: record.id,
      before: { bedi: record.bedi, deviation: record.deviation, status: record.status },
      after: { bedi: result.bedi, deviation: result.deviation, status: result.status },
      remedies: getRemedies(
        result.status,
        age,
        (profile.doshaType as DoshaKey | null) ?? undefined,
        result.deviation
      ),
    });
  }

  const statusChanges = changes.filter((c) => c.before.status !== c.after.status).length;
  console.log(
    `Records: ${records.length} · to update: ${changes.length} (status changes: ${statusChanges}) · unchanged/skipped: ${skipped}`
  );
  for (const c of changes.slice(0, 20)) {
    console.log(
      `  ${c.id}: bedi ${c.before.bedi} → ${c.after.bedi}, Δ ${c.before.deviation} → ${c.after.deviation}, ${c.before.status} → ${c.after.status}`
    );
  }
  if (changes.length > 20) console.log(`  … and ${changes.length - 20} more`);

  if (!APPLY) {
    console.log("\nDry run only. Re-run with --apply to write these changes.");
    return;
  }
  if (changes.length === 0) return;

  const backupPath = `bedi-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const backup = records
    .filter((r) => changes.some((c) => c.id === r.id))
    .map((r) => ({
      id: r.id,
      bedi: r.bedi,
      deviation: r.deviation,
      status: r.status,
      recommendation: r.recommendation,
    }));
  writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`\nBackup written to ${backupPath}`);

  await prisma.$transaction(
    changes.flatMap((c) => [
      prisma.bEDIRecord.update({
        where: { id: c.id },
        data: c.after,
      }),
      prisma.recommendation.upsert({
        where: { bediRecordId: c.id },
        create: {
          bediRecordId: c.id,
          remedies: c.remedies.remedies,
          avoidFoods: c.remedies.avoidFoods,
          riskFactors: c.remedies.riskFactors,
          ageNote: c.remedies.ageNote,
          lifestyle: c.remedies.lifestyle,
          validationStatus: c.remedies.validation?.status ?? null,
          validationAction: c.remedies.validation?.action ?? null,
        },
        update: {
          remedies: c.remedies.remedies,
          avoidFoods: c.remedies.avoidFoods,
          riskFactors: c.remedies.riskFactors,
          ageNote: c.remedies.ageNote,
          lifestyle: c.remedies.lifestyle,
          validationStatus: c.remedies.validation?.status ?? null,
          validationAction: c.remedies.validation?.action ?? null,
        },
      }),
    ])
  );
  console.log(`Updated ${changes.length} records and their recommendations.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
