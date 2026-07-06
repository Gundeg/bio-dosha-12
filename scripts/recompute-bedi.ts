/**
 * BEDI хазайлт/статусын дахин тооцоолол.
 *
 * bediEngine-ийн хазайлтын суурь судалгааны загварт нийцүүлэн шинэчлэгдсэн
 * тул (src/lib/bediConfig.ts-ийн тайлбарыг үз) хадгалагдсан BEDIRecord-уудын
 * deviation/status хуучин масштабтай холилдохгүйн тулд НЭГ УДАА ажиллуулна:
 *
 *   DATABASE_URL=... npx tsx scripts/recompute-bedi.ts
 */
import { prisma } from "../src/lib/prisma";
import { calcAge, calculateBEDI } from "../src/lib/bediEngine";
import type { SeasonKey } from "../src/lib/seasonFactors";

async function main() {
  const records = await prisma.bEDIRecord.findMany({
    include: { profile: true },
  });

  let updated = 0;
  let skipped = 0;

  for (const record of records) {
    const { profile } = record;
    if (!profile?.ktScore) {
      skipped++;
      continue;
    }

    const ageAtRecord = Math.max(
      1,
      calcAge(profile.birthDate) -
        Math.floor(
          (Date.now() - record.date.getTime()) / (365.25 * 24 * 3600 * 1000)
        )
    );

    const result = calculateBEDI({
      weightKg: record.weightKg,
      heightCm: profile.heightCm,
      age: ageAtRecord,
      sex: profile.sex,
      season: record.season as SeasonKey,
      kt: profile.ktScore,
    });

    if (result.deviation === record.deviation && result.status === record.status) {
      skipped++;
      continue;
    }

    await prisma.bEDIRecord.update({
      where: { id: record.id },
      data: { deviation: result.deviation, status: result.status },
    });
    updated++;
  }

  console.log(`Шинэчилсэн: ${updated}, өөрчлөлтгүй/алгассан: ${skipped}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
