import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { AlreadySignedIn } from "@/components/auth/AlreadySignedIn";
import { LoginForm } from "@/components/auth/LoginForm";
import { firstParam, parseLoginNotice, safeNext } from "@/components/auth/safeNext";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("authFlows.login");
  return { title: `${t("metaTitle")} | Bio-Dosha-12` };
}

/**
 * Sign-in. `?next=` (a same-site path, validated here) is where to continue
 * afterwards; `?notice=` shows a confirmation such as "password updated".
 * Someone already signed in can continue or switch to another account.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, session] = await Promise.all([searchParams, auth()]);
  const next = safeNext(firstParam(params.next));
  if (session?.user?.id) {
    return <AlreadySignedIn email={session.user.email ?? null} next={next} />;
  }
  return <LoginForm next={next} notice={parseLoginNotice(firstParam(params.notice))} />;
}
