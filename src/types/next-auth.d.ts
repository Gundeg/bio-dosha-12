import { DefaultSession } from "next-auth";
import type { SessionOrgClaim } from "@/lib/auth.config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /** Platform role: INDIVIDUAL | ADMIN | SUPERADMIN (PRACTITIONER is legacy). */
      role: string;
      /** Session version; a mismatch with the database signs the user out. */
      sv: number;
      mfaEnabled: boolean;
      mfaRequired: boolean;
      /** Active organization membership, if any. */
      org: SessionOrgClaim | null;
    } & DefaultSession["user"];
  }
}
