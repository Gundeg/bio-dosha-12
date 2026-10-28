import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";
import { normalizeEmail } from "./credentials";
import { LOGIN_LIMIT, clientIp, consumeRateLimit, resetRateLimit } from "./rateLimit";

/** How often a signed-in user's role is re-read from the database. */
const ROLE_REFRESH_MS = 60 * 1000;

/** Hash compared when the email is unknown, so response time does not reveal it. */
const DUMMY_HASH = "$2b$12$30vCay4tJ9NZ7VQXOeLJGOAtjhqefZoCToFVI5ybogWdsrXdvWJ/O";

class RateLimited extends CredentialsSignin {
  code = "rate_limited";
}

/**
 * ADMIN_EMAILS орчны хувьсагчид жагсаасан имэйлүүд нэвтрэх үедээ
 * автоматаар ADMIN эрхтэй болно (таслалаар тусгаарлана).
 *
 * The stored email must match an entry exactly. Registration stores emails in
 * lower case, so a case variant such as "Boss@x.mn" can no longer claim the
 * "boss@x.mn" admin entry.
 */
function isConfiguredAdmin(storedEmail: string): boolean {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => normalizeEmail(e))
    .filter(Boolean)
    .includes(storedEmail);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    // Runs on the Node.js runtime (route handlers, server components and the
    // session endpoint). Re-reads the role so approvals, rejections and deleted
    // accounts take effect without waiting for the token to expire.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.roleCheckedAt = Date.now();
        return token;
      }
      if (!token.id) return token;
      const last = typeof token.roleCheckedAt === "number" ? token.roleCheckedAt : 0;
      if (Date.now() - last < ROLE_REFRESH_MS) return token;

      const fresh = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { role: true },
      });
      if (!fresh) return null; // account no longer exists → signed out
      token.role = fresh.role;
      token.roleCheckedAt = Date.now();
      return token;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (typeof credentials?.email !== "string" || typeof credentials?.password !== "string") {
          return null;
        }
        const email = normalizeEmail(credentials.email);
        const password = credentials.password;

        const ip = clientIp(request.headers);
        const [emailOk, ipOk] = await Promise.all([
          consumeRateLimit(`login:email:${email}`, LOGIN_LIMIT.perEmail, LOGIN_LIMIT.windowMs),
          consumeRateLimit(`login:ip:${ip}`, LOGIN_LIMIT.perIp, LOGIN_LIMIT.windowMs),
        ]);
        if (!emailOk || !ipOk) throw new RateLimited();

        // Older accounts may have been stored with capital letters, so match
        // case-insensitively and accept whichever candidate the password fits.
        const candidates = await prisma.user.findMany({
          where: { email: { equals: email, mode: "insensitive" } },
          orderBy: { createdAt: "asc" },
        });
        if (candidates.length === 0) {
          await bcrypt.compare(password, DUMMY_HASH);
          return null;
        }

        let user: (typeof candidates)[number] | null = null;
        for (const candidate of candidates) {
          if (await bcrypt.compare(password, candidate.password)) {
            user = candidate;
            break;
          }
        }
        if (!user) return null;

        // Only failed attempts should count toward the per-email limit.
        await resetRateLimit(`login:email:${email}`);

        let role = user.role;
        if (role !== "ADMIN" && isConfiguredAdmin(user.email)) {
          role = "ADMIN";
          await prisma.user.update({
            where: { id: user.id },
            data: { role },
          });
        }

        return { id: user.id, email: user.email, name: user.name, role };
      },
    }),
  ],
});
