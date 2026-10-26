import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MfaSetupWizard } from "@/components/auth/MfaSetupWizard";
import { firstParam, safeNext } from "@/components/auth/safeNext";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("authFlows.mfa");
  return { title: `${t("metaTitle")} | Bio-Dosha-12`, robots: { index: false, follow: false } };
}

/**
 * 2-step sign-in setup (signed in; the proxy keeps signed-out visitors out).
 * `?next=` is where to continue afterwards, e.g. /settings?tab=security.
 */
export default async function MfaSetupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return <MfaSetupWizard next={safeNext(firstParam(params.next))} />;
}
