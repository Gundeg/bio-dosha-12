import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { AlreadySignedIn } from "@/components/auth/AlreadySignedIn";
import { RegisterForm } from "@/components/auth/RegisterForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("authFlows.register");
  return { title: `${t("metaTitle")} | Bio-Dosha-12` };
}

/**
 * Sign-up: a personal account, or a personal account plus a medical
 * organization. `?type=organization` (the "for clinics" links) preselects the
 * organization option. Someone already signed in is offered to sign out first.
 */
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ type?: string | string[] }> }) {
  const [{ type }, session] = await Promise.all([searchParams, auth()]);
  if (session?.user?.id) {
    return <AlreadySignedIn email={session.user.email ?? null} next={null} />;
  }
  return <RegisterForm initialType={type === "organization" ? "organization" : "individual"} />;
}
