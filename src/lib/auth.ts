import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";
import { normalizeEmail } from "./credentials";
import { createHash } from "node:crypto";
import { z } from "zod";
import { LOGIN_LIMIT, clientIp, hitRateLimit, limitKey, resetRateLimit } from "./rateLimit";
import { findUserIdsByEmail } from "./users";
import { consumeSecondFactor } from "./mfa";
import { audit } from "./audit";

/** How often session claims (role, organization, 2-step status) are re-read. */
const CLAIM_REFRESH_MS = 60 * 1000;

/** A sign-in is valid for at most 12 hours, however actively it is used. */
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;

const EMAIL_FORMAT = z.email().max(320);

/** Short digest of an email for the audit log (correlates attempts without storing the text). */
function emailHash(email: string): string {
  return createHash("sha256").update(email).digest("hex").slice(0, 16);
}

/** Hash compared when the email is unknown, so response time does not reveal it. */
const DUMMY_HASH = "$2b$12$30vCay4tJ9NZ7VQXOeLJGOAtjhqefZoCToFVI5ybogWdsrXdvWJ/O";

// Error codes the login page understands (signIn(...).code).
class RateLimited extends CredentialsSignin {
  code = "rate_limited";
}
class MfaRequired extends CredentialsSignin {
  code = "mfa_required";
}
class MfaInvalid extends CredentialsSignin {
  code = "mfa_invalid";
}
class AccountDisabled extends CredentialsSignin {
  code = "account_disabled";
}

/**
 * Claims for the session cookie. Superadmin access is never granted from an
 * environment variable: it is created with scripts/bootstrap-superadmin.ts so
 * nobody can claim it by registering an email address first.
 */
async function loadClaims(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      role: true,
      disabledAt: true,
      sessionVersion: true,
      totpEnabledAt: true,
      activeOrganizationId: true,
      memberships: {
        where: { status: "ACTIVE" },
        select: { organizationId: true, role: true, organization: { select: { status: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!user || user.disabledAt) return null;
  const active =
    user.memberships.find((m) => m.organizationId === user.activeOrganizationId) ?? user.memberships[0] ?? null;
  const isStaff = user.role === "ADMIN" || user.role === "SUPERADMIN";
  return {
    // Shown in the navigation; refreshed with the other claims after a change.
    name: user.name,
    email: user.email,
    role: user.role,
    sv: user.sessionVersion,
    mfaEnabled: !!user.totpEnabledAt,
    mfaRequired: isStaff || user.memberships.length > 0,
    org: active ? { id: active.organizationId, role: active.role, orgStatus: active.organization.status } : null,
  };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    // Runs on the Node.js runtime (route handlers, server components and the
    // session endpoint). Refreshes claims every minute, immediately after a
    // session update(), and signs the user out when the account is disabled,
    // deleted, or its session version changed (password reset, "sign out everywhere").
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        const claims = await loadClaims(user.id);
        if (!claims) return null;
        const now = Date.now();
        Object.assign(token, claims, { id: user.id, claimsAt: now, authAt: now });
        return token;
      }
      if (!token.id) return token;
      // Absolute lifetime: Auth.js renews the cookie on every request, so
      // without this a session in continuous use would never expire.
      if (typeof token.authAt !== "number" || Date.now() - token.authAt > SESSION_MAX_AGE_MS) return null;
      const last = typeof token.claimsAt === "number" ? token.claimsAt : 0;
      if (trigger !== "update" && Date.now() - last < CLAIM_REFRESH_MS) return token;

      const claims = await loadClaims(token.id as string);
      if (!claims || claims.sv !== token.sv) return null;
      Object.assign(token, claims, { claimsAt: Date.now() });
      return token;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials, request) {
        if (typeof credentials?.email !== "string" || typeof credentials?.password !== "string") {
          return null;
        }
        const email = normalizeEmail(credentials.email);
        const password = credentials.password;
        const code = typeof credentials.code === "string" ? credentials.code.trim() : "";
        const headers = request.headers;
        const ip = clientIp(headers);
        const { windowMs } = LOGIN_LIMIT;

        // Every attempt counts against the network first, even malformed ones.
        const ipCount = await hitRateLimit(`login:ip:${ip}`, windowMs);
        if (ipCount > LOGIN_LIMIT.perIp) {
          if (ipCount === LOGIN_LIMIT.perIp + 1) {
            await audit({ action: "auth.login.blocked", meta: { reason: "rate_limited_ip" }, headers });
          }
          throw new RateLimited();
        }
        if (!EMAIL_FORMAT.safeParse(email).success || password.length === 0 || password.length > 1024) {
          return null;
        }

        // Tight limit per email and network (a stranger elsewhere cannot lock
        // the account), looser ceiling per email (slows distributed guessing).
        const [pairCount, emailCount] = await Promise.all([
          hitRateLimit(limitKey("login:pair", email, ip), windowMs),
          hitRateLimit(limitKey("login:email", email), windowMs),
        ]);
        if (pairCount > LOGIN_LIMIT.perEmailAndIp || emailCount > LOGIN_LIMIT.perEmail) {
          if (pairCount === LOGIN_LIMIT.perEmailAndIp + 1 || emailCount === LOGIN_LIMIT.perEmail + 1) {
            await audit({ action: "auth.login.blocked", meta: { reason: "rate_limited", emailHash: emailHash(email) }, headers });
          }
          throw new RateLimited();
        }

        // Exact (case-insensitive) match; older accounts may differ only by
        // case, so accept whichever candidate the password fits.
        const ids = await findUserIdsByEmail(email);
        const candidates = ids.length
          ? await prisma.user.findMany({ where: { id: { in: ids } }, orderBy: { createdAt: "asc" } })
          : [];
        if (candidates.length === 0) {
          await bcrypt.compare(password, DUMMY_HASH);
          // The typed text may be a mistyped password: store only a digest.
          await audit({ action: "auth.login.failure", meta: { reason: "unknown_email", emailHash: emailHash(email) }, headers });
          return null;
        }

        let user: (typeof candidates)[number] | null = null;
        for (const candidate of candidates) {
          if (await bcrypt.compare(password, candidate.password)) {
            user = candidate;
            break;
          }
        }
        if (!user) {
          await audit({
            action: "auth.login.failure",
            actor: { id: candidates[0].id, email: candidates[0].email, role: candidates[0].role },
            meta: { reason: "password" },
            headers,
          });
          return null;
        }
        const actor = { id: user.id, email: user.email, role: user.role };

        if (user.disabledAt) {
          await audit({ action: "auth.login.blocked", actor, meta: { reason: "disabled" }, headers });
          throw new AccountDisabled();
        }

        // Second step: authenticator code or a one-time recovery code. Fails
        // closed if 2-step sign-in is marked on but the secret is missing.
        if (user.totpEnabledAt) {
          if (!user.totpSecret) {
            await audit({ action: "auth.login.blocked", actor, meta: { reason: "mfa_secret_missing" }, headers });
            throw new MfaInvalid();
          }
          if (!code) throw new MfaRequired();

          // Codes have their own small budget, separate from passwords.
          const mfaCount = await hitRateLimit(`login:mfa:${user.id}`, windowMs);
          if (mfaCount > LOGIN_LIMIT.mfaPerUser) {
            if (mfaCount === LOGIN_LIMIT.mfaPerUser + 1) {
              await audit({ action: "auth.login.blocked", actor, meta: { reason: "rate_limited_mfa" }, headers });
            }
            throw new RateLimited();
          }

          const factor = await consumeSecondFactor(user, code);
          if (!factor) {
            await audit({ action: "auth.login.failure", actor, meta: { reason: "mfa" }, headers });
            throw new MfaInvalid();
          }
          if (factor.method === "recovery") {
            await audit({ action: "auth.mfa.recovery_used", actor, meta: { remaining: factor.remaining }, headers });
          }
          await resetRateLimit(`login:mfa:${user.id}`);
        }

        // A successful sign-in clears this network's counter for the email;
        // the per-email ceiling keeps counting.
        await resetRateLimit(limitKey("login:pair", email, ip));
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        await audit({ action: "auth.login.success", actor, headers });

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
});
