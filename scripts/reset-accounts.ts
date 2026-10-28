/**
 * Delete user accounts and everything that belongs to them, for clearing out
 * test data. Safe by default:
 *
 *   - Without --apply it only lists what would be deleted (dry run).
 *   - --apply also needs --confirm=DELETE-ACCOUNTS, so it cannot run by accident.
 *   - Before deleting it writes a JSON backup of every row it removes
 *     (skip with --no-backup).
 *   - --keep=a@x.mn,b@y.mn keeps those accounts (case-insensitive), their data
 *     and every organization they belong to (with its patients).
 *   - Everything is deleted in one transaction: all or nothing.
 *
 *   DATABASE_URL=... npx tsx scripts/reset-accounts.ts
 *   DATABASE_URL=... npx tsx scripts/reset-accounts.ts --keep=owner@x.mn
 *   DATABASE_URL=... npx tsx scripts/reset-accounts.ts --apply --confirm=DELETE-ACCOUNTS --include-audit-log
 *
 * Deleted: the accounts with their personal and family profiles, BEDI records
 * and recommendations; organizations that have no kept member, with their
 * members, patients, patient profiles, intakes, treatment logs, subscriptions
 * and invitations; invitation and reset links of deleted people; all sign-in
 * rate-limit counters. With --include-audit-log the whole security log is
 * cleared too (use only for a fresh start: the log is otherwise kept).
 * Not touched: plans, the schema and Prisma's migration history.
 *
 * The backup file contains health data (decrypted) and password hashes. It is
 * written to the system's temporary folder (or --backup-dir), never inside the
 * project, which may be synced to the cloud. Delete it once you are sure
 * nothing was needed.
 */
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prisma } from "../src/lib/prisma";
import { normalizeEmail } from "../src/lib/credentials";

const CONFIRM_WORD = "DELETE-ACCOUNTS";
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const confirmed = args.includes(`--confirm=${CONFIRM_WORD}`);
const INCLUDE_AUDIT = args.includes("--include-audit-log");
const NO_BACKUP = args.includes("--no-backup");
// Default outside the project folder, which may be synced to the cloud.
const backupDir = args.find((a) => a.startsWith("--backup-dir="))?.slice("--backup-dir=".length) ?? tmpdir();
const keep = (args.find((a) => a.startsWith("--keep="))?.slice("--keep=".length) ?? "")
  .split(",")
  .map((e) => normalizeEmail(e))
  .filter(Boolean);

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const isKept = (email: string) => keep.includes(normalizeEmail(email));
  const kept = users.filter((u) => isKept(u.email));
  const targets = users.filter((u) => !isKept(u.email));
  const keptIds = kept.map((u) => u.id);
  const targetIds = targets.map((u) => u.id);
  const missingKeeps = keep.filter((k) => !users.some((u) => normalizeEmail(u.email) === k));

  // Organizations survive only when a kept account is a member.
  const organizations = await prisma.organization.findMany({
    select: { id: true, name: true, status: true, members: { select: { userId: true } } },
    orderBy: { createdAt: "asc" },
  });
  const orgTargets = organizations.filter((o) => !o.members.some((m) => keptIds.includes(m.userId)));
  const orgTargetIds = orgTargets.map((o) => o.id);

  const personalProfileWhere = { userId: { in: targetIds }, organizationId: null };
  const orgProfileWhere = { organizationId: { in: orgTargetIds } };
  const profileWhere = { OR: [personalProfileWhere, orgProfileWhere, { userId: null, organizationId: null }] };
  const tokenWhere = {
    OR: [
      { userId: { in: targetIds } },
      { organizationId: { in: orgTargetIds } },
      { email: { notIn: kept.map((u) => normalizeEmail(u.email)) }, organizationId: null },
    ],
  };

  const [profiles, records, patients, intakes, members, subscriptions, tokens, rateLimits, auditRows] = await Promise.all([
    prisma.profile.count({ where: profileWhere }),
    prisma.bEDIRecord.count({ where: { profile: profileWhere } }),
    prisma.patient.count({ where: { OR: [{ organizationId: { in: orgTargetIds } }, { profile: profileWhere }] } }),
    prisma.clinicalIntake.count({ where: { OR: [{ organizationId: { in: orgTargetIds } }, { profile: profileWhere }] } }),
    prisma.organizationMember.count({ where: { OR: [{ userId: { in: targetIds } }, { organizationId: { in: orgTargetIds } }] } }),
    prisma.subscription.count({ where: { OR: [{ userId: { in: targetIds } }, { organizationId: { in: orgTargetIds } }] } }),
    prisma.authToken.count({ where: tokenWhere }),
    prisma.rateLimit.count(),
    INCLUDE_AUDIT ? prisma.auditLog.count() : Promise.resolve(0),
  ]);

  console.log(`Accounts in the database: ${users.length}`);
  for (const u of users) {
    const mark = isKept(u.email) ? "KEEP  " : "DELETE";
    console.log(`  ${mark}  ${u.email.padEnd(36)} ${u.role.padEnd(11)} ${u.name}  (${u.createdAt.toISOString().slice(0, 10)})`);
  }
  if (organizations.length) {
    console.log(`\nOrganizations: ${organizations.length}`);
    for (const o of organizations) {
      const mark = orgTargetIds.includes(o.id) ? "DELETE" : "KEEP  ";
      console.log(`  ${mark}  ${o.name.padEnd(36)} ${o.status}  (${o.members.length} members)`);
    }
  }
  if (missingKeeps.length) console.log(`\nNote: no account found for --keep ${missingKeeps.join(", ")}`);
  console.log(
    `\nWould delete: ${targets.length} accounts, ${orgTargets.length} organizations, ${members} memberships, ` +
      `${profiles} profiles, ${records} BEDI records, ${patients} patients, ${intakes} clinical intakes, ` +
      `${subscriptions} subscriptions, ${tokens} invitation/reset links, ${rateLimits} rate-limit counters` +
      (INCLUDE_AUDIT ? `, ${auditRows} audit log entries.` : ". The audit log is kept (add --include-audit-log to clear it).")
  );
  if (kept.length) console.log(`Would keep: ${kept.length} accounts with their data. Plans are never touched.`);

  if (!APPLY) {
    console.log(`\nDry run only. To delete, re-run with --apply --confirm=${CONFIRM_WORD}`);
    return;
  }
  if (!confirmed) {
    console.log(`\nRefusing to delete: add --confirm=${CONFIRM_WORD} to confirm.`);
    process.exit(1);
  }
  if (targets.length === 0 && orgTargets.length === 0 && !INCLUDE_AUDIT) {
    console.log("Nothing to delete.");
    return;
  }

  if (!NO_BACKUP) {
    const backup = {
      createdAt: new Date().toISOString(),
      users: await prisma.user.findMany({ where: { id: { in: targetIds } } }),
      organizations: await prisma.organization.findMany({
        where: { id: { in: orgTargetIds } },
        include: { members: true, subscription: true },
      }),
      profiles: await prisma.profile.findMany({ where: profileWhere }),
      bediRecords: await prisma.bEDIRecord.findMany({ where: { profile: profileWhere }, include: { recommendation: true } }),
      patients: await prisma.patient.findMany({
        where: { OR: [{ organizationId: { in: orgTargetIds } }, { profile: profileWhere }] },
      }),
      clinicalIntakes: await prisma.clinicalIntake.findMany({
        where: { OR: [{ organizationId: { in: orgTargetIds } }, { profile: profileWhere }] },
        include: { treatmentLog: true },
      }),
      subscriptions: await prisma.subscription.findMany({
        where: { OR: [{ userId: { in: targetIds } }, { organizationId: { in: orgTargetIds } }] },
      }),
    };
    const backupPath = join(backupDir, `accounts-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    writeFileSync(backupPath, JSON.stringify(backup, null, 2), { mode: 0o600 });
    console.log(`\nBackup written to ${backupPath} (contains health data: delete it once checked).`);
  }

  await prisma.$transaction(async (tx) => {
    // Organizations first: cascades to members, patients, patient profiles,
    // intakes, treatment logs, subscriptions and invitations.
    await tx.organization.deleteMany({ where: { id: { in: orgTargetIds } } });
    await tx.authToken.deleteMany({ where: tokenWhere });
    // Accounts: cascades to personal profiles, BEDI records, recommendations,
    // remaining memberships and subscriptions.
    await tx.user.deleteMany({ where: { id: { in: targetIds } } });
    // Profiles left without any owner (legacy data).
    await tx.profile.deleteMany({ where: { userId: null, organizationId: null } });
    await tx.user.updateMany({
      where: { activeOrganizationId: { in: orgTargetIds } },
      data: { activeOrganizationId: null },
    });
    await tx.rateLimit.deleteMany({});
    if (INCLUDE_AUDIT) await tx.auditLog.deleteMany({});
  });
  console.log(
    `Deleted ${targets.length} accounts and ${orgTargets.length} organizations with their data` +
      (INCLUDE_AUDIT ? ", and cleared the audit log." : ".")
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
