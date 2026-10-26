import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/components/auth/RegisterForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("authFlows.register");
  return { title: `${t("metaTitle")} | Bio-Dosha-12` };
}

/**
 * Sign-up: a personal account, or a personal account plus a medical
 * organization. `?type=organization` (the "for clinics" links) preselects the
 * organization option.
 */
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ type?: string | string[] }> }) {
  const { type } = await searchParams;
  return <RegisterForm initialType={type === "organization" ? "organization" : "individual"} />;
}
