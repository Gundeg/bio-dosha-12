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
  // Health data: keep sessions short. The token is refreshed hourly while in use.
  session: { strategy: "jwt", maxAge: 12 * 60 * 60, updateAge: 60 * 60 },
};
