/**
 * Creates the platform owner (SUPERADMIN). Superadmin access is never granted
 * from an environment variable or by registering an address first: it is
 * created here, by someone with database access.
 *
 *   - Normally no account exists yet: a one-time invitation link (valid 24
 *     hours) is printed. Open it, choose a password, then set up 2-step sign-in.
 *   - If an account with the email already exists, the script stops and shows
 *     when it was created and last used, because sign-up is open and anyone
 *     could have registered the address first. Upgrade it only if you created
 *     it yourself: add --upgrade-existing.
 *
 * Safe by default: without --apply it only shows what it would do.
 *
 *   DATABASE_URL=... npx tsx scripts/bootstrap-superadmin.ts owner@example.com
 *   DATABASE_URL=... npx tsx scripts/bootstrap-superadmin.ts owner@example.com --apply --base-url=https://your-site.netlify.app
 *
 * Options:
 *   --apply              write the change
 *   --base-url=URL       site address used in the link (default: APP_URL / AUTH_URL / NEXTAUTH_URL)
 *   --allow-additional   allow a second SUPERADMIN when one already exists
 *   --upgrade-existing   upgrade an existing account (only one you created yourself)
 */
import { prisma } from "../src/lib/prisma";
import { normalizeEmail } from "../src/lib/credentials";
import { createAuthToken, buildAppUrl } from "../src/lib/tokens";
import { audit } from "../src/lib/audit";
import { findUserIdByEmail } from "../src/lib/users";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const ALLOW_ADDITIONAL = args.includes("--allow-additional");
const UPGRADE_EXISTING = args.includes("--upgrade-existing");
const baseUrl = args.find((a) => a.startsWith("--base-url="))?.slice("--base-url=".length);
const rawEmail = args.find((a) => !a.startsWith("--"));

const SUPERADMIN_INVITE_TTL_HOURS = 24;

function siteUrl(path: string): string {
  if (baseUrl) return new URL(path, baseUrl).toString();
  return buildAppUrl(path);
}

async function main() {
  if (!rawEmail || !rawEmail.includes("@")) {
    console.error("Usage: npx tsx scripts/bootstrap-superadmin.ts <email> [--apply] [--base-url=https://...]");
    process.exit(1);
  }
  const email = normalizeEmail(rawEmail);

  const existingSuperadmins = await prisma.user.findMany({
    where: { role: "SUPERADMIN" },
    select: { email: true },
  });
  const others = existingSuperadmins.filter((u) => normalizeEmail(u.email) !== email);
  if (others.length && !ALLOW_ADDITIONAL) {
    console.error(
      `A superadmin already exists (${others.map((o) => o.email).join(", ")}). ` +
        "Invite platform admins from the control center instead, or pass --allow-additional."
    );
    process.exit(1);
  }

  const accountId = await findUserIdByEmail(email);
  const account = accountId
    ? await prisma.user.findUnique({
        where: { id: accountId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          lastLoginAt: true,
          totpEnabledAt: true,
          _count: { select: { memberships: true, profiles: true } },
        },
      })
    : null;

  if (account) {
    if (account.role === "SUPERADMIN") {
      console.log(`${account.email} is already the superadmin. Nothing to do.`);
      return;
    }
    console.log(`An account with this email already exists: ${account.email} (${account.name}), role ${account.role}.`);
    console.log(`  created:       ${account.createdAt.toISOString()}`);
    console.log(`  last sign-in:  ${account.lastLoginAt?.toISOString() ?? "never"}`);
    console.log(`  2-step:        ${account.totpEnabledAt ? "on" : "off"}`);
    console.log(`  memberships:   ${account._count.memberships}, profiles: ${account._count.profiles}`);
    if (!UPGRADE_EXISTING) {
      console.error(
        "\nStopped: sign-up is open, so someone else may have registered this address. If you did not\n" +
          "create this account yourself, remove it (scripts/reset-accounts.ts) and run this script again to get\n" +
          "an invitation link. If it is yours, re-run with --upgrade-existing."
      );
      process.exit(1);
    }
    console.log("Plan: upgrade to SUPERADMIN, enable the account if disabled, sign out everywhere.");
    if (!account.totpEnabledAt) console.log("2-step sign-in is not set up yet: it will be required at the next sign-in.");
    if (!APPLY) {
      console.log("\nDry run only. Re-run with --apply to make the change.");
      return;
    }
    await prisma.user.update({
      where: { id: account.id },
      data: { role: "SUPERADMIN", disabledAt: null, disabledReason: null, sessionVersion: { increment: 1 } },
    });
    await audit({
      action: "admin.user.role_changed",
      targetType: "user",
      targetId: account.id,
      meta: { from: account.role, to: "SUPERADMIN", source: "bootstrap-script" },
    });
    console.log(`\nDone. ${account.email} is now the superadmin. Sign in at ${siteUrl("/login")}`);
    return;
  }

  console.log(`No account for ${email} yet.`);
  console.log(`Plan: create a one-time SUPERADMIN invitation, valid ${SUPERADMIN_INVITE_TTL_HOURS} hours.`);
  if (!APPLY) {
    console.log("\nDry run only. Re-run with --apply (and --base-url=https://your-site) to create the link.");
    return;
  }

  // One live superadmin invitation per address.
  await prisma.authToken.updateMany({
    where: { type: "INVITE", email, platformRole: "SUPERADMIN", usedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  const { raw, record } = await createAuthToken({
    type: "INVITE",
    email,
    platformRole: "SUPERADMIN",
    ttlHours: SUPERADMIN_INVITE_TTL_HOURS,
  });
  await audit({
    action: "admin.invite.created",
    targetType: "invite",
    targetId: record.id,
    meta: { platformRole: "SUPERADMIN", source: "bootstrap-script" },
  });

  console.log("\nOne-time invitation link (shown once; do not share it):\n");
  console.log(`  ${siteUrl(`/invite/${raw}`)}\n`);
  console.log(`Valid until ${record.expiresAt.toISOString()}. Open it, choose a password, then set up 2-step sign-in.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
