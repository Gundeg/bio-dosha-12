import type { NextAuthConfig } from "next-auth";

// Edge-compatible auth config (no DB/prisma imports)
export const authConfig: NextAuthConfig = {
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
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
  // Health data: a session ends after 12 hours without any request (Auth.js
  // renews the expiry while it is used). The default was 30 days.
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
};
