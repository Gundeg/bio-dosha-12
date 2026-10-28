import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../generated/prisma/client";
import { decryptResult, encryptWriteArgs } from "./crypto/encryptedFields";

function isJsonNullSentinel(value: unknown): boolean {
  return value === Prisma.DbNull || value === Prisma.JsonNull || value === Prisma.AnyNull;
}

function createPrismaClient() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const base = new PrismaClient({ adapter });

  // Transparent field encryption: sensitive columns are encrypted on every
  // write and decrypted on every read (see src/lib/crypto/encryptedFields.ts).
  // Verified 2026-10-27: it also applies inside batch and interactive
  // $transaction calls. Raw SQL ($queryRaw / $executeRaw) bypasses it.
  return base.$extends({
    name: "field-encryption",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const nextArgs = encryptWriteArgs(model, operation, args, isJsonNullSentinel);
          const result = await query(nextArgs as typeof args);
          return decryptResult(result);
        },
      },
    },
  });
}

type AppPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as { prisma?: AppPrismaClient };

export const prisma: AppPrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
