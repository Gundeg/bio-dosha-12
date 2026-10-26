import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("authFlows.forgot");
  return { title: `${t("metaTitle")} | Bio-Dosha-12` };
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
