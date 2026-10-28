import { prisma } from "./prisma";
import { normalizeEmail } from "./credentials";

/**
 * Ids of the accounts whose email equals `email` ignoring case, oldest first.
 *
 * Never look emails up with Prisma's `{ equals, mode: "insensitive" }`: it
 * compiles to ILIKE, where "%" and "_" are wildcards, so a sign-in with the
 * email "%" would match every account. `lower(email) = $1` is an exact
 * comparison. (Stored emails are lower case; lower() also covers legacy rows.)
 */
export async function findUserIdsByEmail(email: string): Promise<string[]> {
  const normalized = normalizeEmail(email);
  if (!normalized || normalized.length > 320) return [];
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "User" WHERE lower("email") = ${normalized} ORDER BY "createdAt" ASC LIMIT 5
  `;
  return rows.map((r) => r.id);
}

/** The oldest account with this email (ignoring case), or null. */
export async function findUserIdByEmail(email: string): Promise<string | null> {
  return (await findUserIdsByEmail(email))[0] ?? null;
}
