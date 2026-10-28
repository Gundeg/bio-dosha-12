import type { NextAuthConfig } from "next-auth";

/**
 * Session claims carried in the JWT. The proxy (src/proxy.ts) reads them to
 * route pages without a database call; API routes re-check everything against
 * the database through src/lib/authz.ts.
 */
export interface SessionOrgClaim {
  id: string;
  role: "OWNER" | "ADMIN" | "PRACTITIONER";
  orgStatus: "PENDING" | "ACTIVE" | "SUSPENDED";
}

/** Idle limit; the client keeps it alive while someone is working (SessionKeepAlive). */
export const SESSION_IDLE_SECONDS = 30 * 60;

// Edge-compatible auth config (no DB/prisma imports). The full config with the
// database-backed jwt callback lives in src/lib/auth.ts.
export const authConfig: NextAuthConfig = {
  providers: [],
  callbacks: {
    jwt({ token }) {
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        if (typeof token.name === "string") session.user.name = token.name;
        if (typeof token.email === "string") session.user.email = token.email;
        session.user.role = token.role as string;
        session.user.sv = (token.sv as number | undefined) ?? 0;
        session.user.mfaEnabled = Boolean(token.mfaEnabled);
        session.user.mfaRequired = Boolean(token.mfaRequired);
        session.user.org = (token.org as SessionOrgClaim | null | undefined) ?? null;
      }
      return session;
    },
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
  pages: {
    signIn: "/login",
  },
  // Health data on shared clinic computers: a session ends after 30 minutes
  // without any request. Auth.js re-signs the token (and resets this expiry)
  // on every request, so active use keeps it alive; closing the browser for
  // longer, or leaving it idle, signs the person out. src/lib/auth.ts adds a
  // 12-hour absolute limit on top.
  session: { strategy: "jwt", maxAge: SESSION_IDLE_SECONDS },
};
