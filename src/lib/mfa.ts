import { prisma } from "./prisma";
import { consumeRecoveryCode, looksLikeRecoveryCode, verifyTotp } from "./totp";

export type SecondFactorResult = { method: "totp" } | { method: "recovery"; remaining: number } | null;

/**
 * Checks a 6-digit authenticator code or a one-time recovery code and marks it
 * used. Both writes are conditional on the value just read, so the same code
 * cannot succeed twice, even in two simultaneous requests.
 */
export async function consumeSecondFactor(
  user: { id: string; totpSecret: string | null; recoveryCodeHashes: string[] },
  code: string
): Promise<SecondFactorResult> {
  const clean = code.trim();
  if (!clean || !user.totpSecret) return null;

  if (looksLikeRecoveryCode(clean)) {
    const remaining = consumeRecoveryCode(clean, user.recoveryCodeHashes);
    if (!remaining) return null;
    const res = await prisma.user.updateMany({
      where: { id: user.id, recoveryCodeHashes: { equals: user.recoveryCodeHashes } },
      data: { recoveryCodeHashes: remaining },
    });
    return res.count === 1 ? { method: "recovery", remaining: remaining.length } : null;
  }

  const step = verifyTotp(user.totpSecret, clean);
  if (step === null) return null;
  const res = await prisma.user.updateMany({
    where: { id: user.id, OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }] },
    data: { totpLastStep: step },
  });
  return res.count === 1 ? { method: "totp" } : null;
}
