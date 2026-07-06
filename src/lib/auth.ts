import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";

/**
 * ADMIN_EMAILS орчны хувьсагчид жагсаасан имэйлүүд нэвтрэх үедээ
 * автоматаар ADMIN эрхтэй болно (таслалаар тусгаарлана).
 */
function isConfiguredAdmin(email: string): boolean {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findFirst({
          where: { email: credentials.email as string },
          orderBy: { createdAt: "desc" },
        });
        if (!user) return null;
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!valid) return null;

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
