import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/LoginForm";
import { firstParam, parseLoginNotice, safeNext } from "@/components/auth/safeNext";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("authFlows.login");
  return { title: `${t("metaTitle")} | Bio-Dosha-12` };
}

/**
 * Sign-in. `?next=` (a same-site path, validated here) is where to continue
 * afterwards; `?notice=` shows a confirmation such as "password updated".
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <LoginForm next={safeNext(firstParam(params.next))} notice={parseLoginNotice(firstParam(params.notice))} />
  );
}
